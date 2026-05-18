import Command0 from './commands/accounts/add.js'
import Command1 from './commands/accounts/list.js'
import Command2 from './commands/accounts/remove.js'
import Command3 from './commands/accounts/show.js'
import Command4 from './commands/accounts/use.js'
import Command5 from './commands/api/get.js'
import Command6 from './commands/api/post.js'
import Command7 from './commands/api/request.js'
import Command8 from './commands/auth/logout.js'
import Command9 from './commands/auth/status.js'
import Command10 from './commands/autocomplete.js'
import Command11 from './commands/bridges/list.js'
import Command12 from './commands/bridges/show.js'
import Command13 from './commands/chats/archive.js'
import Command14 from './commands/chats/avatar.js'
import Command15 from './commands/chats/description.js'
import Command16 from './commands/chats/disappear.js'
import Command17 from './commands/chats/draft.js'
import Command18 from './commands/chats/focus.js'
import Command19 from './commands/chats/list.js'
import Command20 from './commands/chats/mark-read.js'
import Command21 from './commands/chats/mark-unread.js'
import Command22 from './commands/chats/mute.js'
import Command23 from './commands/chats/notify-anyway.js'
import Command24 from './commands/chats/pin.js'
import Command25 from './commands/chats/priority.js'
import Command26 from './commands/chats/remind.js'
import Command27 from './commands/chats/rename.js'
import Command28 from './commands/chats/search.js'
import Command29 from './commands/chats/show.js'
import Command30 from './commands/chats/start.js'
import Command31 from './commands/chats/unarchive.js'
import Command32 from './commands/chats/unmute.js'
import Command33 from './commands/chats/unpin.js'
import Command34 from './commands/chats/unremind.js'
import Command35 from './commands/completion.js'
import Command36 from './commands/config/get.js'
import Command37 from './commands/config/path.js'
import Command38 from './commands/config/reset.js'
import Command39 from './commands/config/set.js'
import Command40 from './commands/contacts/list.js'
import Command41 from './commands/contacts/search.js'
import Command42 from './commands/contacts/show.js'
import Command43 from './commands/docs.js'
import Command44 from './commands/doctor.js'
import Command45 from './commands/export.js'
import Command46 from './commands/install/desktop.js'
import Command47 from './commands/install/server.js'
import Command48 from './commands/man.js'
import Command49 from './commands/media/download.js'
import Command50 from './commands/messages/context.js'
import Command51 from './commands/messages/delete.js'
import Command52 from './commands/messages/edit.js'
import Command53 from './commands/messages/export.js'
import Command54 from './commands/messages/list.js'
import Command55 from './commands/messages/search.js'
import Command56 from './commands/messages/show.js'
import Command57 from './commands/plugins.js'
import Command58 from './commands/plugins/available.js'
import Command59 from './commands/presence.js'
import Command60 from './commands/rpc.js'
import Command61 from './commands/send/file.js'
import Command62 from './commands/send/react.js'
import Command63 from './commands/send/sticker.js'
import Command64 from './commands/send/text.js'
import Command65 from './commands/send/unreact.js'
import Command66 from './commands/send/voice.js'
import Command67 from './commands/setup.js'
import Command68 from './commands/status.js'
import Command69 from './commands/targets/add/desktop.js'
import Command70 from './commands/targets/add/remote.js'
import Command71 from './commands/targets/add/server.js'
import Command72 from './commands/targets/disable.js'
import Command73 from './commands/targets/enable.js'
import Command74 from './commands/targets/list.js'
import Command75 from './commands/targets/logs.js'
import Command76 from './commands/targets/remove.js'
import Command77 from './commands/targets/restart.js'
import Command78 from './commands/targets/show.js'
import Command79 from './commands/targets/start.js'
import Command80 from './commands/targets/status.js'
import Command81 from './commands/targets/stop.js'
import Command82 from './commands/targets/use.js'
import Command83 from './commands/update.js'
import Command84 from './commands/verify.js'
import Command85 from './commands/verify/approve.js'
import Command86 from './commands/verify/cancel.js'
import Command87 from './commands/verify/list.js'
import Command88 from './commands/verify/qr-confirm.js'
import Command89 from './commands/verify/qr-scan.js'
import Command90 from './commands/verify/recovery-key.js'
import Command91 from './commands/verify/reset-recovery-key.js'
import Command92 from './commands/verify/sas.js'
import Command93 from './commands/verify/sas-confirm.js'
import Command94 from './commands/verify/show.js'
import Command95 from './commands/verify/start.js'
import Command96 from './commands/verify/status.js'
import Command97 from './commands/version.js'
import Command98 from './commands/watch.js'

export const commands = {
  'accounts add': Command0,
  'accounts list': Command1,
  'accounts remove': Command2,
  'accounts show': Command3,
  'accounts use': Command4,
  'api get': Command5,
  'api post': Command6,
  'api request': Command7,
  'auth logout': Command8,
  'auth status': Command9,
  'autocomplete': Command10,
  'bridges list': Command11,
  'bridges show': Command12,
  'chats archive': Command13,
  'chats avatar': Command14,
  'chats description': Command15,
  'chats disappear': Command16,
  'chats draft': Command17,
  'chats focus': Command18,
  'chats list': Command19,
  'chats mark-read': Command20,
  'chats mark-unread': Command21,
  'chats mute': Command22,
  'chats notify-anyway': Command23,
  'chats pin': Command24,
  'chats priority': Command25,
  'chats remind': Command26,
  'chats rename': Command27,
  'chats search': Command28,
  'chats show': Command29,
  'chats start': Command30,
  'chats unarchive': Command31,
  'chats unmute': Command32,
  'chats unpin': Command33,
  'chats unremind': Command34,
  'completion': Command35,
  'config get': Command36,
  'config path': Command37,
  'config reset': Command38,
  'config set': Command39,
  'contacts list': Command40,
  'contacts search': Command41,
  'contacts show': Command42,
  'docs': Command43,
  'doctor': Command44,
  'export': Command45,
  'install desktop': Command46,
  'install server': Command47,
  'man': Command48,
  'media download': Command49,
  'messages context': Command50,
  'messages delete': Command51,
  'messages edit': Command52,
  'messages export': Command53,
  'messages list': Command54,
  'messages search': Command55,
  'messages show': Command56,
  'plugins': Command57,
  'plugins available': Command58,
  'presence': Command59,
  'rpc': Command60,
  'send file': Command61,
  'send react': Command62,
  'send sticker': Command63,
  'send text': Command64,
  'send unreact': Command65,
  'send voice': Command66,
  'setup': Command67,
  'status': Command68,
  'targets add desktop': Command69,
  'targets add remote': Command70,
  'targets add server': Command71,
  'targets disable': Command72,
  'targets enable': Command73,
  'targets list': Command74,
  'targets logs': Command75,
  'targets remove': Command76,
  'targets restart': Command77,
  'targets show': Command78,
  'targets start': Command79,
  'targets status': Command80,
  'targets stop': Command81,
  'targets use': Command82,
  'update': Command83,
  'verify': Command84,
  'verify approve': Command85,
  'verify cancel': Command86,
  'verify list': Command87,
  'verify qr-confirm': Command88,
  'verify qr-scan': Command89,
  'verify recovery-key': Command90,
  'verify reset-recovery-key': Command91,
  'verify sas': Command92,
  'verify sas-confirm': Command93,
  'verify show': Command94,
  'verify start': Command95,
  'verify status': Command96,
  'version': Command97,
  'watch': Command98,
}
