// Preload: allow importing .scm (tree-sitter query) files as text modules.
import { plugin } from 'bun'

plugin({
  name: 'scm-loader',
  setup(build) {
    build.onLoad({ filter: /\.scm$/ }, async (args) => {
      const text = await Bun.file(args.path).text()
      return {
        contents: `export default ${JSON.stringify(text)};`,
        loader: 'js',
      }
    })
  },
})
