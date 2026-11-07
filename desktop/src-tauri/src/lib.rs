use std::io::Write;
use std::process::{Command, Stdio};

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Emdash desktop shell is running.", name)
}

#[tauri::command]
async fn detect_ollama() -> Result<serde_json::Value, String> {
    if std::env::var("EMDASH_OLLAMA").ok().as_deref() != Some("1")
        && std::env::var("EMDASH_OLLAMA").ok().as_deref() != Some("true")
    {
        return Ok(serde_json::json!({ "available": false, "models": [], "error": "feature disabled" }));
    }
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    match client.get("http://127.0.0.1:11434/api/tags").send().await {
        Ok(resp) if resp.status().is_success() => {
            let data: serde_json::Value = resp.json().await.unwrap_or(serde_json::json!({}));
            let models: Vec<String> = data
                .get("models")
                .and_then(|m| m.as_array())
                .map(|arr| arr.iter().filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(String::from)).collect())
                .unwrap_or_default();
            Ok(serde_json::json!({ "available": true, "models": models }))
        }
        Ok(resp) => Ok(serde_json::json!({ "available": false, "models": [], "error": format!("HTTP {}", resp.status()) })),
        Err(e) => Ok(serde_json::json!({ "available": false, "models": [], "error": e.to_string() })),
    }
}

fn is_within_workspace(workspace: &str, target: &str) -> bool {
    use std::path::{Component, Path, PathBuf};
    let ws = match Path::new(workspace).canonicalize() { Ok(p) => p, Err(_) => return false };
    let full = ws.join(target);
    let full = match full.canonicalize() { Ok(p) => p, Err(_) => {
        // allow non-existent files within workspace for creation
        let mut p = ws.clone();
        for c in Path::new(target).components() {
            match c {
                Component::Normal(x) => p.push(x),
                Component::CurDir => {}
                _ => return false,
            }
        }
        p
    }};
    full.starts_with(&ws)
}

#[tauri::command]
async fn read_workspace_file(workspace: String, relative_path: String) -> Result<String, String> {
    if !is_within_workspace(&workspace, &relative_path) {
        return Err("path outside workspace".to_string());
    }
    let full = std::path::Path::new(&workspace).join(&relative_path);
    std::fs::read_to_string(&full).map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_workspace_file(workspace: String, relative_path: String, content: String) -> Result<(), String> {
    if !is_within_workspace(&workspace, &relative_path) {
        return Err("path outside workspace".to_string());
    }
    let full = std::path::Path::new(&workspace).join(&relative_path);
    if let Some(parent) = full.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&full, content).map_err(|e| e.to_string())
}

#[tauri::command]
async fn pick_workspace(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string()))
}

#[tauri::command]
async fn run_agent(prompt: String, workspace: Option<String>) -> Result<String, String> {
    // Spawn the Bun agent bridge as a sidecar and parse its JSON result.
    let ws = workspace.unwrap_or_else(|| ".".to_string());
    let payload = serde_json::json!({ "prompt": prompt, "workspace": ws });
    let mut child = Command::new("bun")
        .arg("scripts/agent-bridge.ts")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to spawn bridge: {}", e))?;
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(payload.to_string().as_bytes());
    }
    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    // Parse the last JSON line.
    let mut last: Option<serde_json::Value> = None;
    for line in stdout.lines() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            last = Some(v);
        }
    }
    match last {
        Some(v) if v.get("ok").and_then(|b| b.as_bool()) == Some(true) => {
            Ok(v.get("text").and_then(|t| t.as_str()).unwrap_or("").to_string())
        }
        Some(v) => Err(v.get("error").and_then(|e| e.as_str()).unwrap_or("unknown error").to_string()),
        None => Err(format!("bridge produced no JSON result: {}", stdout)),
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, detect_ollama, pick_workspace, run_agent, read_workspace_file, write_workspace_file])
        .setup(|app| {
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
