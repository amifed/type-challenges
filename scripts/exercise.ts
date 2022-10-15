import { execSync } from 'child_process'
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

const formatToCode = (quiz: Partial<Quiz>, locale: SupportedLocale) => {
  return `${toDivider(t(locale, 'divider.code-start'))
  }\n${
    (quiz.template || '').trim()
  }\n\n${
    toDivider(t(locale, 'divider.test-cases'))
  }${quiz.tests || ''
  }\n\n`
}
const exerciseDir = path.resolve(QUIZ_ROOT, folders[0])
const template = fs.readFileSync(path.join(exerciseDir, 'template.ts'), 'utf-8')
const tests = fs.readFileSync(path.join(exerciseDir, 'test-cases.ts'), 'utf-8') || ''
const exerciseFile = path.resolve(exerciseDir, 'exercise.ts')

if (!fs.existsSync(exerciseFile))
  fs.writeFileSync(exerciseFile, formatToCode({ template, tests }, 'zh-CN'))

console.log(exerciseFile)

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
