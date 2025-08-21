import { Context, Logger, Schema } from 'koishi'
import { encode, decode } from './encoding'
import { Session } from 'inspector/promises';

export const name = 'hidden-word'
export const reusable = false
export const usage = `#
hidden-word.encode "text" "secret" \n
hidden-word.decode "text"\n\n

hidden-word "text" ("secret")
`;

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

let log = new Logger('hidden-word')

export function apply(ctx: Context, session: Session) {

  // ctx.i18n.define('zh-CN', { noHidden: '该字符串无隐藏信息。' })
  // ctx.i18n.define('en-US', { noHidden: 'This text has no hidden message.' })

  ctx.command('hidden-word <text> [secret]')
  .action((_,text,secret) => {
    if (secret===undefined){return decode(text)}
    else {return encode(secret,text)}
  })

  ctx.command('hidden-word.encode <text> <secret>')
  .action((_, text, secret) => encode(secret,text))

  ctx.command('hidden-word.decode <text>')
  .action((_, text) => {
    let decoded = decode(text)
    //log.info(decoded=='')
    if (decoded=='') {return 'nop/无隐藏'}
    else {return decoded;}
  })
}
