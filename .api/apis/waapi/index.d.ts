import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values: string[] | number[]): this;
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url: string, variables?: {}): void;
    /**
     * Retrieve a list of your instances.
     *
     * @summary list instances
     */
    getInstances(metadata?: types.GetInstancesMetadataParam): Promise<FetchResponse<200, types.GetInstancesResponse200>>;
    /**
     * Create a new instance
     *
     * @summary create instance
     */
    postInstances(): Promise<FetchResponse<200, types.PostInstancesResponse200>>;
    /**
     * Retrieve a single instance by its ID
     *
     * @summary retrieve instance
     */
    getInstancesId(metadata: types.GetInstancesIdMetadataParam): Promise<FetchResponse<200, types.GetInstancesIdResponse200>>;
    /**
     * Update the instance.
     *
     * @summary update instance
     */
    putInstancesId(body: types.PutInstancesIdBodyParam, metadata: types.PutInstancesIdMetadataParam): Promise<FetchResponse<200, types.PutInstancesIdResponse200>>;
    /**
     * delete an instance by ID
     *
     * @summary delete instance
     */
    deleteInstancesId(metadata: types.DeleteInstancesIdMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * retrieve the status of your running client
     *
     * @summary client status of instance
     */
    getInstancesIdClientStatus(metadata: types.GetInstancesIdClientStatusMetadataParam): Promise<FetchResponse<200, types.GetInstancesIdClientStatusResponse200>>;
    /**
     * Retrieves a base64 encoded QR code image that can be used to authenticate and connect a
     * WhatsApp account to this instance. The QR code should be scanned using the WhatsApp
     * mobile app to complete authentication.
     *
     * @summary retrieve QR Code
     */
    getInstancesIdClientQr(metadata: types.GetInstancesIdClientQrMetadataParam): Promise<FetchResponse<200, types.GetInstancesIdClientQrResponse200>>;
    /**
     * retrieve general information of the whatsapp user conntected to your instance
     *
     * @summary retrieve basic client information
     */
    getInstancesIdClientMe(metadata: types.GetInstancesIdClientMeMetadataParam): Promise<FetchResponse<200, types.GetInstancesIdClientMeResponse200>>;
    /**
     * Send a text message to a chat. The chatId format varies depending on the chat type:
     * - Individual chat: {phone_number}@c.us (e.g. 491234567890@c.us)
     * - Group chat: {group_id}@g.us (e.g. 123456789-123456789@g.us)
     * - Channel/Newsletter: {channel_id}@newsletter (e.g. 123456789@newsletter)
     *
     * @summary Send a text message to a chat
     */
    postInstancesIdClientActionSendMessage(body: types.PostInstancesIdClientActionSendMessageBodyParam, metadata: types.PostInstancesIdClientActionSendMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendMessageResponse200>>;
    /**
     * Send a media message (image, video, audio, document) to a chat. The chatId format varies
     * depending on the chat type:
     * - Individual chat: {phone_number}@c.us (e.g. 123456789@c.us)
     * - Group chat: {group_id}@g.us (e.g. 123456789-123456789@g.us)
     * - Channel/Newsletter: {channel_id}@newsletter (e.g. 123456789@newsletter)
     *
     * Supported media types:
     * - Images: jpg, jpeg, png, gif
     * - Videos: mp4, 3gp, mov
     * - Audio: mp3, wav, ogg, m4a
     * - Documents: pdf, doc, docx, txt, xlsx, etc
     *
     * @summary Send a media message (image, video, audio, document)
     */
    postInstancesIdClientActionSendMedia(body: types.PostInstancesIdClientActionSendMediaBodyParam, metadata: types.PostInstancesIdClientActionSendMediaMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendMediaResponse200>>;
    /**
     * Mark all messages in a chat as seen (read). This will show blue ticks (double check
     * marks) to the sender only if both parties have read receipts enabled in their WhatsApp
     * privacy settings. If read receipts are disabled by either party, the messages will be
     * marked as delivered (gray ticks) instead.
     *
     * @summary Mark chat messages as seen (blue ticks)
     */
    postInstancesIdClientActionSendSeen(body: types.PostInstancesIdClientActionSendSeenBodyParam, metadata: types.PostInstancesIdClientActionSendSeenMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendSeenResponse200>>;
    /**
     * Send a vCard to a contact or group.
     *
     * @summary Send vCard
     */
    postInstancesIdClientActionSendVcard(body: types.PostInstancesIdClientActionSendVcardBodyParam, metadata: types.PostInstancesIdClientActionSendVcardMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendVcardResponse200>>;
    /**
     * Send a location message to a contact or group chat. The location can include additional
     * details like name, address and URL.
     *
     * @summary Send Location
     */
    postInstancesIdClientActionSendLocation(body: types.PostInstancesIdClientActionSendLocationBodyParam, metadata: types.PostInstancesIdClientActionSendLocationMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendLocationResponse200>>;
    /**
     * Retrieves a list of all chats with their latest messages and metadata. Supports
     * pagination.
     *
     * @summary Get all chats
     */
    postInstancesIdClientActionGetChats(body: types.PostInstancesIdClientActionGetChatsBodyParam, metadata: types.PostInstancesIdClientActionGetChatsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChatsResponse200>>;
    /**
     * Marks a specified chat conversation as unread. This is useful for flagging important
     * conversations for later attention.
     *
     * @summary Mark Chat as Unread
     */
    postInstancesIdClientActionMarkChatUnread(body: types.PostInstancesIdClientActionMarkChatUnreadBodyParam, metadata: types.PostInstancesIdClientActionMarkChatUnreadMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionMarkChatUnreadResponse200>>;
    /**
     * Mute notifications for a specific chat either indefinitely or until a specified date
     *
     * @summary Mute Chat
     */
    postInstancesIdClientActionMuteChat(body: types.PostInstancesIdClientActionMuteChatBodyParam, metadata: types.PostInstancesIdClientActionMuteChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionMuteChatResponse200>>;
    /**
     * Removes mute settings from a specified chat, allowing notifications to be received
     * again.
     *
     * @summary Unmute Chat
     */
    postInstancesIdClientActionUnmuteChat(body: types.PostInstancesIdClientActionUnmuteChatBodyParam, metadata: types.PostInstancesIdClientActionUnmuteChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnmuteChatResponse200>>;
    /**
     * Pins a chat to the top of the chat list. The operation may fail if the maximum number of
     * pinned chats (3) has been reached.
     *
     * @summary Pin Chat
     */
    postInstancesIdClientActionPinChat(body: types.PostInstancesIdClientActionPinChatBodyParam, metadata: types.PostInstancesIdClientActionPinChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionPinChatResponse200>>;
    /**
     * Removes a chat from pinned status. This endpoint allows you to unpin a previously pinned
     * chat conversation.
     *
     * @summary Unpin Chat
     */
    postInstancesIdClientActionUnpinChat(body: types.PostInstancesIdClientActionUnpinChatBodyParam, metadata: types.PostInstancesIdClientActionUnpinChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnpinChatResponse200>>;
    /**
     * Retrieve messages from a specific chat with optional filtering and media inclusion
     *
     * @summary Fetch messages from a chat
     */
    postInstancesIdClientActionFetchMessages(body: types.PostInstancesIdClientActionFetchMessagesBodyParam, metadata: types.PostInstancesIdClientActionFetchMessagesMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionFetchMessagesResponse200>>;
    /**
     * Retrieve a specific message using its unique identifier. Optionally includes the media
     * content if requested.
     *
     * @summary Get Message by ID
     */
    postInstancesIdClientActionGetMessageById(body: types.PostInstancesIdClientActionGetMessageByIdBodyParam, metadata: types.PostInstancesIdClientActionGetMessageByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetMessageByIdResponse200>>;
    /**
     * get a message info by id
     *
     * @summary get message info by id
     */
    postInstancesIdClientActionGetMessageInfoById(body: types.PostInstancesIdClientActionGetMessageInfoByIdBodyParam, metadata: types.PostInstancesIdClientActionGetMessageInfoByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetMessageInfoByIdResponse200>>;
    /**
     * delete a message by id
     *
     * @summary delete message by id
     */
    postInstancesIdClientActionDeleteMessageById(body: types.PostInstancesIdClientActionDeleteMessageByIdBodyParam, metadata: types.PostInstancesIdClientActionDeleteMessageByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionDeleteMessageByIdResponse200>>;
    /**
     * Search for messages across all chats or within a specific chat. Returns paginated
     * results with message details.
     *
     * @summary Search Messages
     */
    postInstancesIdClientActionSearchMessages(body: types.PostInstancesIdClientActionSearchMessagesBodyParam, metadata: types.PostInstancesIdClientActionSearchMessagesMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSearchMessagesResponse200>>;
    /**
     * Retrieves a list of all contacts from the WhatsApp account, including saved contacts and
     * WhatsApp users who have messaged you.
     *
     * @summary Get all WhatsApp contacts
     */
    postInstancesIdClientActionGetContacts(metadata: types.PostInstancesIdClientActionGetContactsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetContactsResponse200>>;
    /**
     * Converts a phone number into the proper WhatsApp chat ID format. This is especially
     * useful for countries that don't follow the standard chat ID format (like Brazil, Mexico
     * and Argentina). The endpoint ensures you get the correct chat ID for any phone number.
     *
     * @summary Get WhatsApp chat ID from phone number
     */
    postInstancesIdClientActionGetNumberId(body: types.PostInstancesIdClientActionGetNumberIdBodyParam, metadata: types.PostInstancesIdClientActionGetNumberIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetNumberIdResponse200>>;
    /**
     * Get the country code for a given phone number
     *
     * @summary get country code
     */
    postInstancesIdClientActionGetCountryCode(body: types.PostInstancesIdClientActionGetCountryCodeBodyParam, metadata: types.PostInstancesIdClientActionGetCountryCodeMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetCountryCodeResponse200>>;
    /**
     * Format a phone number into standardized format
     *
     * @summary get formatted number
     */
    postInstancesIdClientActionGetFormattedNumber(body: types.PostInstancesIdClientActionGetFormattedNumberBodyParam, metadata: types.PostInstancesIdClientActionGetFormattedNumberMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetFormattedNumberResponse200>>;
    /**
     * Check if a given contactId is registered.
     *
     * @summary is registered user
     */
    postInstancesIdClientActionIsRegisteredUser(body: types.PostInstancesIdClientActionIsRegisteredUserBodyParam, metadata: types.PostInstancesIdClientActionIsRegisteredUserMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionIsRegisteredUserResponse200>>;
    /**
     * Creates and sends an interactive poll message to a specified chat. The poll can have
     * between 2-12 options and optionally allow multiple selections.
     *
     * @summary Create Poll Message
     */
    postInstancesIdClientActionCreatePoll(body: types.PostInstancesIdClientActionCreatePollBodyParam, metadata: types.PostInstancesIdClientActionCreatePollMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionCreatePollResponse200>>;
    /**
     * Retrieves all available WhatsApp stories/status updates that are visible to the
     * authenticated user. This includes both viewed and unviewed stories from contacts.
     *
     * @summary Get WhatsApp Stories
     */
    postInstancesIdClientActionGetStories(metadata: types.PostInstancesIdClientActionGetStoriesMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetStoriesResponse200>>;
    /**
     * Retrieves the profile picture URL for a contact, chat, group, or newsletter. Access is
     * subject to privacy settings. Use appropriate suffixes: @c.us for contacts/chats, @g.us
     * for groups, @newsletter for newsletters.
     *
     * @summary Get Profile Picture URL
     */
    postInstancesIdClientActionGetProfilePicUrl(body: types.PostInstancesIdClientActionGetProfilePicUrlBodyParam, metadata: types.PostInstancesIdClientActionGetProfilePicUrlMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetProfilePicUrlResponse200>>;
    /**
     * Retrieves detailed contact information for a specific WhatsApp contact using their ID.
     * Returns contact details including name, number, business status, and various contact
     * flags.
     *
     * @summary Get Contact Details by ID
     */
    postInstancesIdClientActionGetContactById(body: types.PostInstancesIdClientActionGetContactByIdBodyParam, metadata: types.PostInstancesIdClientActionGetContactByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetContactByIdResponse200>>;
    /**
     * Blocks a WhatsApp contact, preventing them from sending messages to the authenticated
     * user. The contact will not be able to see the user's last seen, online status, or status
     * updates.
     *
     * @summary Block a WhatsApp Contact
     */
    postInstancesIdClientActionBlockContact(body: types.PostInstancesIdClientActionBlockContactBodyParam, metadata: types.PostInstancesIdClientActionBlockContactMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionBlockContactResponse200>>;
    /**
     * Removes a contact from the blocked contacts list, allowing them to send messages and see
     * your information again according to your privacy settings.
     *
     * @summary Unblock a WhatsApp Contact
     */
    postInstancesIdClientActionUnblockContact(body: types.PostInstancesIdClientActionUnblockContactBodyParam, metadata: types.PostInstancesIdClientActionUnblockContactMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnblockContactResponse200>>;
    /**
     * Retrieves a list of all blocked contacts
     *
     * @summary Get blocked contacts
     */
    postInstancesIdClientActionGetBlockedContacts(metadata: types.PostInstancesIdClientActionGetBlockedContactsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetBlockedContactsResponse200>>;
    /**
     * Get list of groups that are in common between you and the specified contact
     *
     * @summary Get common groups with contact
     */
    postInstancesIdClientActionGetCommonGroups(body: types.PostInstancesIdClientActionGetCommonGroupsBodyParam, metadata: types.PostInstancesIdClientActionGetCommonGroupsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetCommonGroupsResponse200>>;
    /**
     * Retrieves the about/status info for a specific contact
     *
     * @summary Get contact about info
     */
    postInstancesIdClientActionGetContactAboutInfo(body: types.PostInstancesIdClientActionGetContactAboutInfoBodyParam, metadata: types.PostInstancesIdClientActionGetContactAboutInfoMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetContactAboutInfoResponse200>>;
    /**
     * Get chat by ID
     *
     * @summary get chat by id
     */
    postInstancesIdClientActionGetChatById(body: types.PostInstancesIdClientActionGetChatByIdBodyParam, metadata: types.PostInstancesIdClientActionGetChatByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChatByIdResponse200>>;
    /**
     * Delete chat by ID
     *
     * @summary delete chat by id
     */
    postInstancesIdClientActionDeleteChatById(body: types.PostInstancesIdClientActionDeleteChatByIdBodyParam, metadata: types.PostInstancesIdClientActionDeleteChatByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionDeleteChatByIdResponse200>>;
    /**
     * Creates a new WhatsApp group with specified name and participants
     *
     * @summary Create Group
     */
    postInstancesIdClientActionCreateGroup(body: types.PostInstancesIdClientActionCreateGroupBodyParam, metadata: types.PostInstancesIdClientActionCreateGroupMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionCreateGroupResponse200>>;
    /**
     * Get group participants
     *
     * @summary get group participants
     */
    postInstancesIdClientActionGetGroupParticipants(body: types.PostInstancesIdClientActionGetGroupParticipantsBodyParam, metadata: types.PostInstancesIdClientActionGetGroupParticipantsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetGroupParticipantsResponse200>>;
    /**
     * Get group info
     *
     * @summary get group info
     */
    postInstancesIdClientActionGetGroupInfo(body: types.PostInstancesIdClientActionGetGroupInfoBodyParam, metadata: types.PostInstancesIdClientActionGetGroupInfoMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetGroupInfoResponse200>>;
    /**
     * Get reactions for a specific message
     *
     * @summary get message reactions
     */
    postInstancesIdClientActionGetReactions(body: types.PostInstancesIdClientActionGetReactionsBodyParam, metadata: types.PostInstancesIdClientActionGetReactionsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetReactionsResponse200>>;
    /**
     * Add or remove a reaction emoji to/from a message
     *
     * @summary react to message
     */
    postInstancesIdClientActionReactToMessage(body: types.PostInstancesIdClientActionReactToMessageBodyParam, metadata: types.PostInstancesIdClientActionReactToMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionReactToMessageResponse200>>;
    /**
     * Update Group Information
     *
     * @summary update group info
     */
    postInstancesIdClientActionUpdateGroupInfo(body: types.PostInstancesIdClientActionUpdateGroupInfoBodyParam, metadata: types.PostInstancesIdClientActionUpdateGroupInfoMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUpdateGroupInfoResponse200>>;
    /**
     * Get mentions from a message
     *
     * @summary get message mentions
     */
    postInstancesIdClientActionGetMessageMentions(body: types.PostInstancesIdClientActionGetMessageMentionsBodyParam, metadata: types.PostInstancesIdClientActionGetMessageMentionsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetMessageMentionsResponse200>>;
    /**
     * Pin a message in a chat
     *
     * @summary pin message
     */
    postInstancesIdClientActionPinMessage(body: types.PostInstancesIdClientActionPinMessageBodyParam, metadata: types.PostInstancesIdClientActionPinMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionPinMessageResponse200>>;
    /**
     * Unpin a message in a chat
     *
     * @summary unpin message
     */
    postInstancesIdClientActionUnpinMessage(body: types.PostInstancesIdClientActionUnpinMessageBodyParam, metadata: types.PostInstancesIdClientActionUnpinMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnpinMessageResponse200>>;
    /**
     * Star a message by its ID
     *
     * @summary star message
     */
    postInstancesIdClientActionStarMessage(body: types.PostInstancesIdClientActionStarMessageBodyParam, metadata: types.PostInstancesIdClientActionStarMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionStarMessageResponse200>>;
    /**
     * Remove star from a message
     *
     * @summary unstar message
     */
    postInstancesIdClientActionUnstarMessage(body: types.PostInstancesIdClientActionUnstarMessageBodyParam, metadata: types.PostInstancesIdClientActionUnstarMessageMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnstarMessageResponse200>>;
    /**
     * Update Group Settings
     *
     * @summary update group settings
     */
    postInstancesIdClientActionUpdateGroupSettings(body: types.PostInstancesIdClientActionUpdateGroupSettingsBodyParam, metadata: types.PostInstancesIdClientActionUpdateGroupSettingsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUpdateGroupSettingsResponse200>>;
    /**
     * Add a participant to a group
     *
     * @summary add group participant
     */
    postInstancesIdClientActionAddGroupParticipant(body: types.PostInstancesIdClientActionAddGroupParticipantBodyParam, metadata: types.PostInstancesIdClientActionAddGroupParticipantMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionAddGroupParticipantResponse200>>;
    /**
     * Remove a participant from a group
     *
     * @summary remove group participant
     */
    postInstancesIdClientActionRemoveGroupParticipant(body: types.PostInstancesIdClientActionRemoveGroupParticipantBodyParam, metadata: types.PostInstancesIdClientActionRemoveGroupParticipantMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionRemoveGroupParticipantResponse200>>;
    /**
     * Promote a participant to admin
     *
     * @summary promote group participant
     */
    postInstancesIdClientActionPromoteGroupParticipant(body: types.PostInstancesIdClientActionPromoteGroupParticipantBodyParam, metadata: types.PostInstancesIdClientActionPromoteGroupParticipantMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionPromoteGroupParticipantResponse200>>;
    /**
     * Demote a participant from admin to normal participant
     *
     * @summary demote group participant
     */
    postInstancesIdClientActionDemoteGroupParticipant(body: types.PostInstancesIdClientActionDemoteGroupParticipantBodyParam, metadata: types.PostInstancesIdClientActionDemoteGroupParticipantMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionDemoteGroupParticipantResponse200>>;
    /**
     * Approve pending group membership requests
     *
     * @summary approve group membership requests
     */
    postInstancesIdClientActionAcceptGroupMemberRequests(body: types.PostInstancesIdClientActionAcceptGroupMemberRequestsBodyParam, metadata: types.PostInstancesIdClientActionAcceptGroupMemberRequestsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionAcceptGroupMemberRequestsResponse200>>;
    /**
     * Deny pending group membership requests
     *
     * @summary deny group membership requests
     */
    postInstancesIdClientActionDenyGroupMemberRequests(body: types.PostInstancesIdClientActionDenyGroupMemberRequestsBodyParam, metadata: types.PostInstancesIdClientActionDenyGroupMemberRequestsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionDenyGroupMemberRequestsResponse200>>;
    /**
     * Get pending group membership requests
     *
     * @summary get group membership requests
     */
    postInstancesIdClientActionGetGroupMemberRequests(body: types.PostInstancesIdClientActionGetGroupMemberRequestsBodyParam, metadata: types.PostInstancesIdClientActionGetGroupMemberRequestsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetGroupMemberRequestsResponse200>>;
    /**
     * Accept a WhatsApp group invite using an invite code
     *
     * @summary accept group invite
     */
    postInstancesIdClientActionAcceptInvite(body: types.PostInstancesIdClientActionAcceptInviteBodyParam, metadata: types.PostInstancesIdClientActionAcceptInviteMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionAcceptInviteResponse200>>;
    /**
     * Get information about a group invite code
     *
     * @summary get group invite info
     */
    postInstancesIdClientActionGetInviteInfo(body: types.PostInstancesIdClientActionGetInviteInfoBodyParam, metadata: types.PostInstancesIdClientActionGetInviteInfoMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetInviteInfoResponse200>>;
    /**
     * Create a channel
     *
     * @summary create a channel
     */
    postInstancesIdClientActionCreateChannel(body: types.PostInstancesIdClientActionCreateChannelBodyParam, metadata: types.PostInstancesIdClientActionCreateChannelMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionCreateChannelResponse200>>;
    /**
     * get your channels
     *
     * @summary get channels
     */
    postInstancesIdClientActionGetChannels(metadata: types.PostInstancesIdClientActionGetChannelsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChannelsResponse200>>;
    /**
     * get channel by id
     *
     * @summary get channel by id
     */
    postInstancesIdClientActionGetChannelById(body: types.PostInstancesIdClientActionGetChannelByIdBodyParam, metadata: types.PostInstancesIdClientActionGetChannelByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChannelByIdResponse200>>;
    /**
     * subscribe to channel
     *
     * @summary subscribe to channel
     */
    postInstancesIdClientActionSubscribeToChannel(body: types.PostInstancesIdClientActionSubscribeToChannelBodyParam, metadata: types.PostInstancesIdClientActionSubscribeToChannelMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSubscribeToChannelResponse200>>;
    /**
     * unsubscribe from channel
     *
     * @summary unsubscribe from channel
     */
    postInstancesIdClientActionUnsubscribeFromChannel(body: types.PostInstancesIdClientActionUnsubscribeFromChannelBodyParam, metadata: types.PostInstancesIdClientActionUnsubscribeFromChannelMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnsubscribeFromChannelResponse200>>;
    /**
     * Search for WhatsApp channels
     *
     * @summary search channels
     */
    postInstancesIdClientActionSearchChannels(body: types.PostInstancesIdClientActionSearchChannelsBodyParam, metadata: types.PostInstancesIdClientActionSearchChannelsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSearchChannelsResponse200>>;
    /**
     * archive chat
     *
     * @summary archive chat
     */
    postInstancesIdClientActionArchiveChat(body: types.PostInstancesIdClientActionArchiveChatBodyParam, metadata: types.PostInstancesIdClientActionArchiveChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionArchiveChatResponse200>>;
    /**
     * unarchive chat
     *
     * @summary unarchive chat
     */
    postInstancesIdClientActionUnarchiveChat(body: types.PostInstancesIdClientActionUnarchiveChatBodyParam, metadata: types.PostInstancesIdClientActionUnarchiveChatMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionUnarchiveChatResponse200>>;
    /**
     * get all labels
     *
     */
    postInstancesIdClientActionGetLabels(metadata: types.PostInstancesIdClientActionGetLabelsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetLabelsResponse200>>;
    /**
     * Get label by ID
     *
     * @summary get label by id
     */
    postInstancesIdClientActionGetLabelById(body: types.PostInstancesIdClientActionGetLabelByIdBodyParam, metadata: types.PostInstancesIdClientActionGetLabelByIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetLabelByIdResponse200>>;
    /**
     * Get chat labels by chat ID
     *
     * @summary get chat labels
     */
    postInstancesIdClientActionGetChatLabels(body: types.PostInstancesIdClientActionGetChatLabelsBodyParam, metadata: types.PostInstancesIdClientActionGetChatLabelsMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChatLabelsResponse200>>;
    /**
     * Get chats by label ID
     *
     * @summary get chats by labelId
     */
    postInstancesIdClientActionGetChatsByLabelId(body: types.PostInstancesIdClientActionGetChatsByLabelIdBodyParam, metadata: types.PostInstancesIdClientActionGetChatsByLabelIdMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionGetChatsByLabelIdResponse200>>;
    /**
     * Logs out the client, closing the current session
     *
     * @summary logout
     */
    postInstancesIdClientActionLogout(metadata: types.PostInstancesIdClientActionLogoutMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionLogoutResponse200>>;
    /**
     * Reboots your WhatsApp instance. This will close the current session and restart the
     * client. The instance will need to be re-authenticated if it was previously logged in.
     *
     * @summary Reboot Instance
     */
    postInstancesIdClientActionReboot(metadata: types.PostInstancesIdClientActionRebootMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionRebootResponse200>>;
    /**
     * Sets the client's presence status to 'available'/'online'
     *
     * @summary Send presence available
     */
    postInstancesIdClientActionSendPresenceAvailable(metadata: types.PostInstancesIdClientActionSendPresenceAvailableMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendPresenceAvailableResponse200>>;
    /**
     * Sets the WhatsApp status text for the connected account
     *
     * @summary Set WhatsApp status
     */
    postInstancesIdClientActionSetStatus(body: types.PostInstancesIdClientActionSetStatusBodyParam, metadata: types.PostInstancesIdClientActionSetStatusMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSetStatusResponse200>>;
    /**
     * Sets the display name for the WhatsApp account
     *
     * @summary Set display name
     */
    postInstancesIdClientActionSetDisplayName(body: types.PostInstancesIdClientActionSetDisplayNameBodyParam, metadata: types.PostInstancesIdClientActionSetDisplayNameMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSetDisplayNameResponse200>>;
    /**
     * Request a WhatsApp pairing code for phone number registration. To prevent abuse and
     * ensure system stability, pairing code requests are limited to 2 per minute. Multiple
     * rapid requests may indicate automated abuse attempts to Whatsapp.
     *
     * @summary Request Pairing Code
     */
    postInstancesIdClientActionRequestPairingCode(body: types.PostInstancesIdClientActionRequestPairingCodeBodyParam, metadata: types.PostInstancesIdClientActionRequestPairingCodeMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionRequestPairingCodeResponse200>>;
    /**
     * Sends typing state indicator to a chat
     *
     * @summary Send typing state
     */
    postInstancesIdClientActionSendTyping(body: types.PostInstancesIdClientActionSendTypingBodyParam, metadata: types.PostInstancesIdClientActionSendTypingMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendTypingResponse200>>;
    /**
     * Clears all messages from a specific chat
     *
     * @summary Clear chat messages
     */
    postInstancesIdClientActionClearChatMessages(body: types.PostInstancesIdClientActionClearChatMessagesBodyParam, metadata: types.PostInstancesIdClientActionClearChatMessagesMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionClearChatMessagesResponse200>>;
    /**
     * Synchronizes the chat history for a specific chat
     *
     * @summary Sync chat history
     */
    postInstancesIdClientActionSyncChatHistory(body: types.PostInstancesIdClientActionSyncChatHistoryBodyParam, metadata: types.PostInstancesIdClientActionSyncChatHistoryMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSyncChatHistoryResponse200>>;
    /**
     * Stops the typing indicator for a chat
     *
     * @summary Stop typing indicator
     */
    postInstancesIdClientActionSendStopTyping(body: types.PostInstancesIdClientActionSendStopTypingBodyParam, metadata: types.PostInstancesIdClientActionSendStopTypingMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendStopTypingResponse200>>;
    /**
     * Sets the client's presence status to 'unavailable'/'offline'
     *
     * @summary Send presence unavailable
     */
    postInstancesIdClientActionSendPresenceUnavailable(metadata: types.PostInstancesIdClientActionSendPresenceUnavailableMetadataParam): Promise<FetchResponse<200, types.PostInstancesIdClientActionSendPresenceUnavailableResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
