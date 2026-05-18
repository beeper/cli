import Command0 from './commands/accounts/add.js'
import Command1 from './commands/accounts/list.js'
import Command2 from './commands/accounts/remove.js'
import Command3 from './commands/accounts/show.js'
import Command4 from './commands/accounts/use.js'
import Command5 from './commands/api/get.js'
import Command6 from './commands/api/post.js'
import Command7 from './commands/api/request.js'
import Command8 from './commands/auth/email/response.js'
import Command9 from './commands/auth/email/start.js'
import Command10 from './commands/auth/logout.js'
import Command11 from './commands/auth/status.js'
import Command12 from './commands/autocomplete.js'
import Command13 from './commands/bridges/list.js'
import Command14 from './commands/bridges/show.js'
import Command15 from './commands/chats/archive.js'
import Command16 from './commands/chats/avatar.js'
import Command17 from './commands/chats/description.js'
import Command18 from './commands/chats/disappear.js'
import Command19 from './commands/chats/draft.js'
import Command20 from './commands/chats/focus.js'
import Command21 from './commands/chats/list.js'
import Command22 from './commands/chats/mark-read.js'
import Command23 from './commands/chats/mark-unread.js'
import Command24 from './commands/chats/mute.js'
import Command25 from './commands/chats/notify-anyway.js'
import Command26 from './commands/chats/pin.js'
import Command27 from './commands/chats/priority.js'
import Command28 from './commands/chats/remind.js'
import Command29 from './commands/chats/rename.js'
import Command30 from './commands/chats/search.js'
import Command31 from './commands/chats/show.js'
import Command32 from './commands/chats/start.js'
import Command33 from './commands/chats/unarchive.js'
import Command34 from './commands/chats/unmute.js'
import Command35 from './commands/chats/unpin.js'
import Command36 from './commands/chats/unremind.js'
import Command37 from './commands/completion.js'
import Command38 from './commands/config/get.js'
import Command39 from './commands/config/path.js'
import Command40 from './commands/config/reset.js'
import Command41 from './commands/config/set.js'
import Command42 from './commands/contacts/list.js'
import Command43 from './commands/contacts/search.js'
import Command44 from './commands/contacts/show.js'
import Command45 from './commands/docs.js'
import Command46 from './commands/doctor.js'
import Command47 from './commands/export.js'
import Command48 from './commands/install/desktop.js'
import Command49 from './commands/install/server.js'
import Command50 from './commands/man.js'
import Command51 from './commands/media/download.js'
import Command52 from './commands/messages/context.js'
import Command53 from './commands/messages/delete.js'
import Command54 from './commands/messages/edit.js'
import Command55 from './commands/messages/export.js'
import Command56 from './commands/messages/list.js'
import Command57 from './commands/messages/search.js'
import Command58 from './commands/messages/show.js'
import Command59 from './commands/plugins.js'
import Command60 from './commands/plugins/available.js'
import Command61 from './commands/presence.js'
import Command62 from './commands/rpc.js'
import Command63 from './commands/send/file.js'
import Command64 from './commands/send/react.js'
import Command65 from './commands/send/sticker.js'
import Command66 from './commands/send/text.js'
import Command67 from './commands/send/unreact.js'
import Command68 from './commands/send/voice.js'
import Command69 from './commands/setup.js'
import Command70 from './commands/status.js'
import Command71 from './commands/targets/add/desktop.js'
import Command72 from './commands/targets/add/remote.js'
import Command73 from './commands/targets/add/server.js'
import Command74 from './commands/targets/disable.js'
import Command75 from './commands/targets/enable.js'
import Command76 from './commands/targets/list.js'
import Command77 from './commands/targets/logs.js'
import Command78 from './commands/targets/remove.js'
import Command79 from './commands/targets/restart.js'
import Command80 from './commands/targets/show.js'
import Command81 from './commands/targets/start.js'
import Command82 from './commands/targets/status.js'
import Command83 from './commands/targets/stop.js'
import Command84 from './commands/targets/use.js'
import Command85 from './commands/update.js'
import Command86 from './commands/verify.js'
import Command87 from './commands/verify/approve.js'
import Command88 from './commands/verify/cancel.js'
import Command89 from './commands/verify/list.js'
import Command90 from './commands/verify/qr-confirm.js'
import Command91 from './commands/verify/qr-scan.js'
import Command92 from './commands/verify/recovery-key.js'
import Command93 from './commands/verify/reset-recovery-key.js'
import Command94 from './commands/verify/sas.js'
import Command95 from './commands/verify/sas-confirm.js'
import Command96 from './commands/verify/show.js'
import Command97 from './commands/verify/start.js'
import Command98 from './commands/verify/status.js'
import Command99 from './commands/version.js'
import Command100 from './commands/watch.js'

export const commands = {
  'accounts': Command1,
  'accounts:add': Command0,
  'accounts:chats': Command21,
  'accounts:list': Command1,
  'accounts:remove': Command2,
  'accounts:show': Command3,
  'accounts:use': Command4,
  'api:get': Command5,
  'api:post': Command6,
  'api:request': Command7,
  'auth:email:response': Command8,
  'auth:email:start': Command9,
  'auth:logout': Command10,
  'auth:status': Command11,
  'autocomplete': Command12,
  'bridges': Command13,
  'bridges:list': Command13,
  'bridges:show': Command14,
  'chats': Command21,
  'chats:archive': Command15,
  'chats:avatar': Command16,
  'chats:description': Command17,
  'chats:disappear': Command18,
  'chats:draft': Command19,
  'chats:focus': Command20,
  'chats:list': Command21,
  'chats:mark-read': Command22,
  'chats:mark-unread': Command23,
  'chats:mute': Command24,
  'chats:notify-anyway': Command25,
  'chats:pin': Command26,
  'chats:priority': Command27,
  'chats:remind': Command28,
  'chats:rename': Command29,
  'chats:search': Command30,
  'chats:show': Command31,
  'chats:start': Command32,
  'chats:unarchive': Command33,
  'chats:unmute': Command34,
  'chats:unpin': Command35,
  'chats:unremind': Command36,
  'completion': Command37,
  'config:get': Command38,
  'config:path': Command39,
  'config:reset': Command40,
  'config:set': Command41,
  'contacts': Command42,
  'contacts:list': Command42,
  'contacts:search': Command43,
  'contacts:show': Command44,
  'docs': Command45,
  'doctor': Command46,
  'export': Command47,
  'install:desktop': Command48,
  'install:server': Command49,
  'man': Command50,
  'media:download': Command51,
  'messages:context': Command52,
  'messages:delete': Command53,
  'messages:edit': Command54,
  'messages:export': Command55,
  'messages:list': Command56,
  'messages:search': Command57,
  'messages:show': Command58,
  'plugins': Command59,
  'plugins:available': Command60,
  'presence': Command61,
  'rpc': Command62,
  'send:file': Command63,
  'send:react': Command64,
  'send:sticker': Command65,
  'send:text': Command66,
  'send:unreact': Command67,
  'send:voice': Command68,
  'setup': Command69,
  'status': Command70,
  'targets': Command76,
  'targets:add:desktop': Command71,
  'targets:add:remote': Command72,
  'targets:add:server': Command73,
  'targets:disable': Command74,
  'targets:enable': Command75,
  'targets:list': Command76,
  'targets:logs': Command77,
  'targets:remove': Command78,
  'targets:restart': Command79,
  'targets:show': Command80,
  'targets:start': Command81,
  'targets:status': Command82,
  'targets:stop': Command83,
  'targets:use': Command84,
  'update': Command85,
  'verify': Command86,
  'verify:approve': Command87,
  'verify:cancel': Command88,
  'verify:list': Command89,
  'verify:qr-confirm': Command90,
  'verify:qr-scan': Command91,
  'verify:recovery-key': Command92,
  'verify:reset-recovery-key': Command93,
  'verify:sas': Command94,
  'verify:sas-confirm': Command95,
  'verify:show': Command96,
  'verify:start': Command97,
  'verify:status': Command98,
  'version': Command99,
  'watch': Command100,
}
