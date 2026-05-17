# BeeperDesktop

Types:

- <code><a href="./src/resources/top-level.ts">FocusResponse</a></code>
- <code><a href="./src/resources/top-level.ts">SearchResponse</a></code>

Methods:

- <code title="post /v1/focus">client.<a href="./src/index.ts">focus</a>({ ...params }) -> FocusResponse</code>
- <code title="get /v1/search">client.<a href="./src/index.ts">search</a>({ ...params }) -> SearchResponse</code>

# Shared

Types:

- <code><a href="./src/resources/shared.ts">APIError</a></code>
- <code><a href="./src/resources/shared.ts">AppStateSnapshot</a></code>
- <code><a href="./src/resources/shared.ts">Attachment</a></code>
- <code><a href="./src/resources/shared.ts">AttachmentCapabilities</a></code>
- <code><a href="./src/resources/shared.ts">ChatCapabilities</a></code>
- <code><a href="./src/resources/shared.ts">ChatDraft</a></code>
- <code><a href="./src/resources/shared.ts">ChatStateCapabilities</a></code>
- <code><a href="./src/resources/shared.ts">DraftAttachment</a></code>
- <code><a href="./src/resources/shared.ts">Error</a></code>
- <code><a href="./src/resources/shared.ts">LinkPreview</a></code>
- <code><a href="./src/resources/shared.ts">Message</a></code>
- <code><a href="./src/resources/shared.ts">Reaction</a></code>
- <code><a href="./src/resources/shared.ts">SendStatus</a></code>
- <code><a href="./src/resources/shared.ts">User</a></code>

# Accounts

Types:

- <code><a href="./src/resources/accounts/accounts.ts">Account</a></code>
- <code><a href="./src/resources/accounts/accounts.ts">AccountBridge</a></code>
- <code><a href="./src/resources/accounts/accounts.ts">AccountRetrieveResponse</a></code>
- <code><a href="./src/resources/accounts/accounts.ts">AccountListResponse</a></code>

Methods:

- <code title="get /v1/accounts/{accountID}">client.accounts.<a href="./src/resources/accounts/accounts.ts">retrieve</a>(accountID) -> AccountRetrieveResponse</code>
- <code title="get /v1/accounts">client.accounts.<a href="./src/resources/accounts/accounts.ts">list</a>() -> AccountListResponse</code>

## Contacts

Types:

- <code><a href="./src/resources/accounts/contacts.ts">ContactSearchResponse</a></code>

Methods:

- <code title="get /v1/accounts/{accountID}/contacts/list">client.accounts.contacts.<a href="./src/resources/accounts/contacts.ts">list</a>(accountID, { ...params }) -> UsersCursorSearch</code>
- <code title="get /v1/accounts/{accountID}/contacts">client.accounts.contacts.<a href="./src/resources/accounts/contacts.ts">search</a>(accountID, { ...params }) -> ContactSearchResponse</code>

# Bridges

Types:

- <code><a href="./src/resources/bridges/bridges.ts">Bridge</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">BridgeLogin</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">CookieField</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">DisappearingTimerCapability</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">GroupFieldCapability</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">GroupTypeCapabilities</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">LoginFlow</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">LoginInputField</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">LoginSession</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">ProvisioningCapabilities</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">ResolveIdentifierCapabilities</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">BridgeRetrieveResponse</a></code>
- <code><a href="./src/resources/bridges/bridges.ts">BridgeListResponse</a></code>

Methods:

- <code title="get /v1/bridges/{bridgeID}">client.bridges.<a href="./src/resources/bridges/bridges.ts">retrieve</a>(bridgeID) -> BridgeRetrieveResponse</code>
- <code title="get /v1/bridges">client.bridges.<a href="./src/resources/bridges/bridges.ts">list</a>() -> BridgeListResponse</code>
- <code title="get /v1/bridges/{bridgeID}/capabilities">client.bridges.<a href="./src/resources/bridges/bridges.ts">retrieveCapabilities</a>(bridgeID) -> ProvisioningCapabilities</code>

## LoginFlows

Types:

- <code><a href="./src/resources/bridges/login-flows.ts">LoginFlowListResponse</a></code>

Methods:

- <code title="get /v1/bridges/{bridgeID}/login-flows">client.bridges.loginFlows.<a href="./src/resources/bridges/login-flows.ts">list</a>(bridgeID) -> LoginFlowListResponse</code>

## Logins

Types:

- <code><a href="./src/resources/bridges/logins.ts">LoginListResponse</a></code>
- <code><a href="./src/resources/bridges/logins.ts">LoginRemoveResponse</a></code>

Methods:

- <code title="get /v1/bridges/{bridgeID}/logins/{loginID}">client.bridges.logins.<a href="./src/resources/bridges/logins.ts">retrieve</a>(loginID, { ...params }) -> BridgeLogin</code>
- <code title="get /v1/bridges/{bridgeID}/logins">client.bridges.logins.<a href="./src/resources/bridges/logins.ts">list</a>(bridgeID) -> LoginListResponse</code>
- <code title="post /v1/bridges/{bridgeID}/logins/{loginID}/remove">client.bridges.logins.<a href="./src/resources/bridges/logins.ts">remove</a>(loginID, { ...params }) -> LoginRemoveResponse</code>

## LoginSessions

Types:

- <code><a href="./src/resources/bridges/login-sessions/login-sessions.ts">LoginSessionCancelResponse</a></code>

Methods:

- <code title="post /v1/bridges/{bridgeID}/login-sessions">client.bridges.loginSessions.<a href="./src/resources/bridges/login-sessions/login-sessions.ts">create</a>(bridgeID, { ...params }) -> LoginSession</code>
- <code title="get /v1/bridges/{bridgeID}/login-sessions/{loginSessionID}">client.bridges.loginSessions.<a href="./src/resources/bridges/login-sessions/login-sessions.ts">retrieve</a>(loginSessionID, { ...params }) -> LoginSession</code>
- <code title="delete /v1/bridges/{bridgeID}/login-sessions/{loginSessionID}">client.bridges.loginSessions.<a href="./src/resources/bridges/login-sessions/login-sessions.ts">cancel</a>(loginSessionID, { ...params }) -> LoginSessionCancelResponse</code>

### Steps

Methods:

- <code title="post /v1/bridges/{bridgeID}/login-sessions/{loginSessionID}/steps/{stepID}">client.bridges.loginSessions.steps.<a href="./src/resources/bridges/login-sessions/steps.ts">submit</a>(stepID, { ...params }) -> LoginSession</code>

# Chats

Types:

- <code><a href="./src/resources/chats/chats.ts">Chat</a></code>
- <code><a href="./src/resources/chats/chats.ts">ChatCreateResponse</a></code>
- <code><a href="./src/resources/chats/chats.ts">ChatListResponse</a></code>
- <code><a href="./src/resources/chats/chats.ts">ChatStartResponse</a></code>

Methods:

- <code title="post /v1/chats">client.chats.<a href="./src/resources/chats/chats.ts">create</a>({ ...params }) -> ChatCreateResponse</code>
- <code title="get /v1/chats/{chatID}">client.chats.<a href="./src/resources/chats/chats.ts">retrieve</a>(chatID, { ...params }) -> Chat</code>
- <code title="patch /v1/chats/{chatID}">client.chats.<a href="./src/resources/chats/chats.ts">update</a>(chatID, { ...params }) -> Chat</code>
- <code title="get /v1/chats">client.chats.<a href="./src/resources/chats/chats.ts">list</a>({ ...params }) -> ChatListResponsesCursorNoLimit</code>
- <code title="post /v1/chats/{chatID}/archive">client.chats.<a href="./src/resources/chats/chats.ts">archive</a>(chatID, { ...params }) -> void</code>
- <code title="post /v1/chats/{chatID}/read">client.chats.<a href="./src/resources/chats/chats.ts">markRead</a>(chatID, { ...params }) -> Chat</code>
- <code title="post /v1/chats/{chatID}/unread">client.chats.<a href="./src/resources/chats/chats.ts">markUnread</a>(chatID, { ...params }) -> Chat</code>
- <code title="post /v1/chats/{chatID}/notify-anyway">client.chats.<a href="./src/resources/chats/chats.ts">notifyAnyway</a>(chatID) -> Chat</code>
- <code title="get /v1/chats/search">client.chats.<a href="./src/resources/chats/chats.ts">search</a>({ ...params }) -> ChatsCursorSearch</code>
- <code title="post /v1/chats/start">client.chats.<a href="./src/resources/chats/chats.ts">start</a>({ ...params }) -> ChatStartResponse</code>

## Reminders

Methods:

- <code title="post /v1/chats/{chatID}/reminders">client.chats.reminders.<a href="./src/resources/chats/reminders.ts">create</a>(chatID, { ...params }) -> void</code>
- <code title="delete /v1/chats/{chatID}/reminders">client.chats.reminders.<a href="./src/resources/chats/reminders.ts">delete</a>(chatID) -> void</code>

## Messages

### Reactions

Types:

- <code><a href="./src/resources/chats/messages/reactions.ts">ReactionDeleteResponse</a></code>
- <code><a href="./src/resources/chats/messages/reactions.ts">ReactionAddResponse</a></code>

Methods:

- <code title="delete /v1/chats/{chatID}/messages/{messageID}/reactions/{reactionKey}">client.chats.messages.reactions.<a href="./src/resources/chats/messages/reactions.ts">delete</a>(reactionKey, { ...params }) -> ReactionDeleteResponse</code>
- <code title="post /v1/chats/{chatID}/messages/{messageID}/reactions">client.chats.messages.reactions.<a href="./src/resources/chats/messages/reactions.ts">add</a>(messageID, { ...params }) -> ReactionAddResponse</code>

# Messages

Types:

- <code><a href="./src/resources/messages.ts">MessageUpdateResponse</a></code>
- <code><a href="./src/resources/messages.ts">MessageSendResponse</a></code>

Methods:

- <code title="get /v1/chats/{chatID}/messages/{messageID}">client.messages.<a href="./src/resources/messages.ts">retrieve</a>(messageID, { ...params }) -> Message</code>
- <code title="put /v1/chats/{chatID}/messages/{messageID}">client.messages.<a href="./src/resources/messages.ts">update</a>(messageID, { ...params }) -> MessageUpdateResponse</code>
- <code title="get /v1/chats/{chatID}/messages">client.messages.<a href="./src/resources/messages.ts">list</a>(chatID, { ...params }) -> MessagesCursorNoLimit</code>
- <code title="delete /v1/chats/{chatID}/messages/{messageID}">client.messages.<a href="./src/resources/messages.ts">delete</a>(messageID, { ...params }) -> void</code>
- <code title="get /v1/messages/search">client.messages.<a href="./src/resources/messages.ts">search</a>({ ...params }) -> MessagesCursorSearch</code>
- <code title="post /v1/chats/{chatID}/messages">client.messages.<a href="./src/resources/messages.ts">send</a>(chatID, { ...params }) -> MessageSendResponse</code>

# Assets

Types:

- <code><a href="./src/resources/assets.ts">AssetDownloadResponse</a></code>
- <code><a href="./src/resources/assets.ts">AssetUploadResponse</a></code>
- <code><a href="./src/resources/assets.ts">AssetUploadBase64Response</a></code>

Methods:

- <code title="post /v1/assets/download">client.assets.<a href="./src/resources/assets.ts">download</a>({ ...params }) -> AssetDownloadResponse</code>
- <code title="get /v1/assets/serve">client.assets.<a href="./src/resources/assets.ts">serve</a>({ ...params }) -> Response</code>
- <code title="post /v1/assets/upload">client.assets.<a href="./src/resources/assets.ts">upload</a>({ ...params }) -> AssetUploadResponse</code>
- <code title="post /v1/assets/upload/base64">client.assets.<a href="./src/resources/assets.ts">uploadBase64</a>({ ...params }) -> AssetUploadBase64Response</code>

# Info

Types:

- <code><a href="./src/resources/info.ts">InfoRetrieveResponse</a></code>

Methods:

- <code title="get /v1/info">client.info.<a href="./src/resources/info.ts">retrieve</a>() -> InfoRetrieveResponse</code>

# App

Types:

- <code><a href="./src/resources/app/app.ts">RecoveryKeyResetResponse</a></code>
- <code><a href="./src/resources/app/app.ts">SetupCompleteResponse</a></code>
- <code><a href="./src/resources/app/app.ts">SetupRegistrationRequiredResponse</a></code>
- <code><a href="./src/resources/app/app.ts">SetupResponseOutput</a></code>
- <code><a href="./src/resources/app/app.ts">SetupStateResponse</a></code>
- <code><a href="./src/resources/app/app.ts">Verification</a></code>
- <code><a href="./src/resources/app/app.ts">VerificationResponse</a></code>

## Setup

Types:

- <code><a href="./src/resources/app/setup/setup.ts">SetupRetrieveResponse</a></code>
- <code><a href="./src/resources/app/setup/setup.ts">SetupRegisterResponse</a></code>
- <code><a href="./src/resources/app/setup/setup.ts">SetupResponseResponse</a></code>
- <code><a href="./src/resources/app/setup/setup.ts">SetupStartResponse</a></code>

Methods:

- <code title="get /v1/app/setup">client.app.setup.<a href="./src/resources/app/setup/setup.ts">retrieve</a>() -> SetupRetrieveResponse</code>
- <code title="post /v1/app/setup/email">client.app.setup.<a href="./src/resources/app/setup/setup.ts">email</a>({ ...params }) -> void</code>
- <code title="post /v1/app/setup/register">client.app.setup.<a href="./src/resources/app/setup/setup.ts">register</a>({ ...params }) -> SetupRegisterResponse</code>
- <code title="post /v1/app/setup/response">client.app.setup.<a href="./src/resources/app/setup/setup.ts">response</a>({ ...params }) -> SetupResponseResponse</code>
- <code title="post /v1/app/setup/start">client.app.setup.<a href="./src/resources/app/setup/setup.ts">start</a>() -> SetupStartResponse</code>

### RecoveryKey

Types:

- <code><a href="./src/resources/app/setup/recovery-key/recovery-key.ts">RecoveryKeyVerifyResponse</a></code>

Methods:

- <code title="post /v1/app/setup/verification/recovery-key">client.app.setup.recoveryKey.<a href="./src/resources/app/setup/recovery-key/recovery-key.ts">verify</a>({ ...params }) -> RecoveryKeyVerifyResponse</code>

#### Reset

Types:

- <code><a href="./src/resources/app/setup/recovery-key/reset.ts">ResetCreateResponse</a></code>
- <code><a href="./src/resources/app/setup/recovery-key/reset.ts">ResetConfirmResponse</a></code>

Methods:

- <code title="post /v1/app/setup/verification/recovery-key/reset">client.app.setup.recoveryKey.reset.<a href="./src/resources/app/setup/recovery-key/reset.ts">create</a>({ ...params }) -> ResetCreateResponse</code>
- <code title="post /v1/app/setup/verification/recovery-key/reset/confirm">client.app.setup.recoveryKey.reset.<a href="./src/resources/app/setup/recovery-key/reset.ts">confirm</a>({ ...params }) -> ResetConfirmResponse</code>

### Verifications

Types:

- <code><a href="./src/resources/app/setup/verifications/verifications.ts">VerificationCreateResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/verifications.ts">VerificationRetrieveResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/verifications.ts">VerificationListResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/verifications.ts">VerificationAcceptResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/verifications.ts">VerificationCancelResponse</a></code>

Methods:

- <code title="post /v1/app/setup/verifications">client.app.setup.verifications.<a href="./src/resources/app/setup/verifications/verifications.ts">create</a>({ ...params }) -> VerificationCreateResponse</code>
- <code title="get /v1/app/setup/verifications/{verificationID}">client.app.setup.verifications.<a href="./src/resources/app/setup/verifications/verifications.ts">retrieve</a>(verificationID) -> VerificationRetrieveResponse</code>
- <code title="get /v1/app/setup/verifications">client.app.setup.verifications.<a href="./src/resources/app/setup/verifications/verifications.ts">list</a>() -> VerificationListResponse</code>
- <code title="post /v1/app/setup/verifications/{verificationID}/accept">client.app.setup.verifications.<a href="./src/resources/app/setup/verifications/verifications.ts">accept</a>(verificationID) -> VerificationAcceptResponse</code>
- <code title="post /v1/app/setup/verifications/{verificationID}/cancel">client.app.setup.verifications.<a href="./src/resources/app/setup/verifications/verifications.ts">cancel</a>(verificationID, { ...params }) -> VerificationCancelResponse</code>

#### QR

Types:

- <code><a href="./src/resources/app/setup/verifications/qr.ts">QRConfirmScannedResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/qr.ts">QRScanResponse</a></code>

Methods:

- <code title="post /v1/app/setup/verifications/{verificationID}/qr/confirm-scanned">client.app.setup.verifications.qr.<a href="./src/resources/app/setup/verifications/qr.ts">confirmScanned</a>(verificationID) -> QRConfirmScannedResponse</code>
- <code title="post /v1/app/setup/verifications/qr/scan">client.app.setup.verifications.qr.<a href="./src/resources/app/setup/verifications/qr.ts">scan</a>({ ...params }) -> QRScanResponse</code>

#### SAS

Types:

- <code><a href="./src/resources/app/setup/verifications/sas.ts">SASConfirmResponse</a></code>
- <code><a href="./src/resources/app/setup/verifications/sas.ts">SASStartResponse</a></code>

Methods:

- <code title="post /v1/app/setup/verifications/{verificationID}/sas/confirm">client.app.setup.verifications.sas.<a href="./src/resources/app/setup/verifications/sas.ts">confirm</a>(verificationID) -> SASConfirmResponse</code>
- <code title="post /v1/app/setup/verifications/{verificationID}/sas/start">client.app.setup.verifications.sas.<a href="./src/resources/app/setup/verifications/sas.ts">start</a>(verificationID) -> SASStartResponse</code>
