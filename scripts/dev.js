/**
 * 打包开发环境
 *
 * node scripts/dev.js --format esm
 */
import { parseArgs } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'
import { createRequire } from 'node:module'
/**
 * 解析命令行参数
 */
const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

// 创建 esm 的 __filename
const __filename = fileURLToPath(import.meta.url)
// 创建 esm 的 __dirname
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)
const target = positionals.length ? positionals[0] : 'vue'

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)

/**
 * --format cjs or esm
 * cjs => reactive.cjs.js
 * esm => reactive.esm.js
 * @type {string}
 */
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)

const pkg = require(`../packages/${target}/package.json`)

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 打包格式 cjs esm iife    platform: format === 'cjs' ? 'node' : 'browser', // 打包平台 node browser    sourcemap: true, // 开启 sourcemap 方便调试
    bundle: true, // 把所有的依赖，打包到一个文件中
    globalName: pkg.buildOptions.name,
  })
  .then(async ctx => {
    // 获取绝对监听路径
    const watchPath = resolve(__dirname, `../packages/${target}/src`)
    console.log(`🔍 监听路径: ${watchPath}`)

    const chokidar = await import('chokidar')
    const watcher = chokidar.watch(watchPath, {
      ignored: /(^|[/\\])\../,
      persistent: true,
      ignoreInitial: true,
    })

    watcher
      .on('change', path => {
        const relativePath = path.replace(process.cwd(), '').replace(/\\/g, '/')
        console.log(`📄 文件变化: ${relativePath}`)
      })
      .on('error', error => {
        console.error(`❌ 监听错误:`, error)
      })

    // 启动监听并添加服务
    ctx.watch().then(() => {
      console.log(`👀 监听 ${target} 文件变化中...`)
      ctx
        .serve({
          servedir: dirname(outfile),
        })
        .then(server => {
          console.log(`🔄 构建服务已启动: ${outfile}`)
          // 添加重新打包完成监听
        })
    })

    // 保持进程持续运行
    const keepAlive = () => {
      // 使用 stdin 保持进程运行
      process.stdin.resume()

      return new Promise(resolve => {
        const shutdown = () => {
          ctx.dispose().then(() => {
            console.log('🚪 已停止监听')
            resolve()
            process.exit(0)
          })
        }

        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)
        process.on('uncaughtException', shutdown)
      })
    }

    return keepAlive()
  })
  .catch(e => {
    console.error('❌ 构建失败:', e)
    process.exit(1)
  })
