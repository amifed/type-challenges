import { exec, execSync } from 'child_process'
import path from 'path'
import fg from 'fast-glob'
import fs from 'fs-extra'
import chokidar from 'chokidar'
import { QUIZ_ROOT, loadQuizByNo } from './loader'
import { toCommentBlock } from './actions/utils/toCommentBlock'
import { toDivider } from './actions/utils/toDivider'
import { toFooter } from './actions/utils/toFooter'
import { toInfoHeader } from './actions/utils/toInfoHeader'
import { toLinks } from './actions/utils/toLinks'
import type { SupportedLocale } from './locales'
import { defaultLocale, t } from './locales'
import type { Quiz } from './types'
import { formatToCode } from './actions/utils/formatToCode'

const [, , no] = process.argv

if (!no) {
  console.log('Please specify an questions number')
  process.exit(1)
}

const padNo = no.padStart(5, '0')

const folders = fg.sync(`${padNo}-*`, {
  onlyDirectories: true,
  cwd: QUIZ_ROOT,
})

if (!folders.length) {
  console.log('Please specify an valid questions number')
  process.exit(1)
}
const exerciseFile = path.resolve(QUIZ_ROOT, folders[0], 'exercise.ts')

const generator = async () => {
  const quiz = await loadQuizByNo(padNo)
  if (!fs.existsSync(exerciseFile) && quiz)
    await fs.writeFile(exerciseFile, formatToCode(quiz, 'zh-CN'))
  exec(`eslint ${exerciseFile} --fix`)
}

generator()

chokidar.watch(exerciseFile).on('all', () => {
  try {
    console.clear()
    console.log('Checking types...')
    execSync(`tsc "${exerciseFile}" --noEmit --strict`, {
      stdio: 'inherit',
    })
    console.log('Typecheck complete. You finished the exercise!')
  }
  catch (e) {
    console.log('Failed, Try again!')
  }
})
