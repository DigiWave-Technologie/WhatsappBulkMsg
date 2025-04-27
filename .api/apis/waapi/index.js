"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'waapi/v1.6.0 (api/6.1.2)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
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
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
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
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Retrieve a list of your instances.
     *
     * @summary list instances
     */
    SDK.prototype.getInstances = function (metadata) {
        return this.core.fetch('/instances', 'get', metadata);
    };
    /**
     * Create a new instance
     *
     * @summary create instance
     */
    SDK.prototype.postInstances = function () {
        return this.core.fetch('/instances', 'post');
    };
    /**
     * Retrieve a single instance by its ID
     *
     * @summary retrieve instance
     */
    SDK.prototype.getInstancesId = function (metadata) {
        return this.core.fetch('/instances/{id}', 'get', metadata);
    };
    /**
     * Update the instance.
     *
     * @summary update instance
     */
    SDK.prototype.putInstancesId = function (body, metadata) {
        return this.core.fetch('/instances/{id}', 'put', body, metadata);
    };
    /**
     * delete an instance by ID
     *
     * @summary delete instance
     */
    SDK.prototype.deleteInstancesId = function (metadata) {
        return this.core.fetch('/instances/{id}', 'delete', metadata);
    };
    /**
     * retrieve the status of your running client
     *
     * @summary client status of instance
     */
    SDK.prototype.getInstancesIdClientStatus = function (metadata) {
        return this.core.fetch('/instances/{id}/client/status', 'get', metadata);
    };
    /**
     * Retrieves a base64 encoded QR code image that can be used to authenticate and connect a
     * WhatsApp account to this instance. The QR code should be scanned using the WhatsApp
     * mobile app to complete authentication.
     *
     * @summary retrieve QR Code
     */
    SDK.prototype.getInstancesIdClientQr = function (metadata) {
        return this.core.fetch('/instances/{id}/client/qr', 'get', metadata);
    };
    /**
     * retrieve general information of the whatsapp user conntected to your instance
     *
     * @summary retrieve basic client information
     */
    SDK.prototype.getInstancesIdClientMe = function (metadata) {
        return this.core.fetch('/instances/{id}/client/me', 'get', metadata);
    };
    /**
     * Send a text message to a chat. The chatId format varies depending on the chat type:
     * - Individual chat: {phone_number}@c.us (e.g. 491234567890@c.us)
     * - Group chat: {group_id}@g.us (e.g. 123456789-123456789@g.us)
     * - Channel/Newsletter: {channel_id}@newsletter (e.g. 123456789@newsletter)
     *
     * @summary Send a text message to a chat
     */
    SDK.prototype.postInstancesIdClientActionSendMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-message', 'post', body, metadata);
    };
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
    SDK.prototype.postInstancesIdClientActionSendMedia = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-media', 'post', body, metadata);
    };
    /**
     * Mark all messages in a chat as seen (read). This will show blue ticks (double check
     * marks) to the sender only if both parties have read receipts enabled in their WhatsApp
     * privacy settings. If read receipts are disabled by either party, the messages will be
     * marked as delivered (gray ticks) instead.
     *
     * @summary Mark chat messages as seen (blue ticks)
     */
    SDK.prototype.postInstancesIdClientActionSendSeen = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-seen', 'post', body, metadata);
    };
    /**
     * Send a vCard to a contact or group.
     *
     * @summary Send vCard
     */
    SDK.prototype.postInstancesIdClientActionSendVcard = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-vcard', 'post', body, metadata);
    };
    /**
     * Send a location message to a contact or group chat. The location can include additional
     * details like name, address and URL.
     *
     * @summary Send Location
     */
    SDK.prototype.postInstancesIdClientActionSendLocation = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-location', 'post', body, metadata);
    };
    /**
     * Retrieves a list of all chats with their latest messages and metadata. Supports
     * pagination.
     *
     * @summary Get all chats
     */
    SDK.prototype.postInstancesIdClientActionGetChats = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-chats', 'post', body, metadata);
    };
    /**
     * Marks a specified chat conversation as unread. This is useful for flagging important
     * conversations for later attention.
     *
     * @summary Mark Chat as Unread
     */
    SDK.prototype.postInstancesIdClientActionMarkChatUnread = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/mark-chat-unread', 'post', body, metadata);
    };
    /**
     * Mute notifications for a specific chat either indefinitely or until a specified date
     *
     * @summary Mute Chat
     */
    SDK.prototype.postInstancesIdClientActionMuteChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/mute-chat', 'post', body, metadata);
    };
    /**
     * Removes mute settings from a specified chat, allowing notifications to be received
     * again.
     *
     * @summary Unmute Chat
     */
    SDK.prototype.postInstancesIdClientActionUnmuteChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unmute-chat', 'post', body, metadata);
    };
    /**
     * Pins a chat to the top of the chat list. The operation may fail if the maximum number of
     * pinned chats (3) has been reached.
     *
     * @summary Pin Chat
     */
    SDK.prototype.postInstancesIdClientActionPinChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/pin-chat', 'post', body, metadata);
    };
    /**
     * Removes a chat from pinned status. This endpoint allows you to unpin a previously pinned
     * chat conversation.
     *
     * @summary Unpin Chat
     */
    SDK.prototype.postInstancesIdClientActionUnpinChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unpin-chat', 'post', body, metadata);
    };
    /**
     * Retrieve messages from a specific chat with optional filtering and media inclusion
     *
     * @summary Fetch messages from a chat
     */
    SDK.prototype.postInstancesIdClientActionFetchMessages = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/fetch-messages', 'post', body, metadata);
    };
    /**
     * Retrieve a specific message using its unique identifier. Optionally includes the media
     * content if requested.
     *
     * @summary Get Message by ID
     */
    SDK.prototype.postInstancesIdClientActionGetMessageById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-message-by-id', 'post', body, metadata);
    };
    /**
     * get a message info by id
     *
     * @summary get message info by id
     */
    SDK.prototype.postInstancesIdClientActionGetMessageInfoById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-message-info-by-id', 'post', body, metadata);
    };
    /**
     * delete a message by id
     *
     * @summary delete message by id
     */
    SDK.prototype.postInstancesIdClientActionDeleteMessageById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/delete-message-by-id', 'post', body, metadata);
    };
    /**
     * Search for messages across all chats or within a specific chat. Returns paginated
     * results with message details.
     *
     * @summary Search Messages
     */
    SDK.prototype.postInstancesIdClientActionSearchMessages = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/search-messages', 'post', body, metadata);
    };
    /**
     * Retrieves a list of all contacts from the WhatsApp account, including saved contacts and
     * WhatsApp users who have messaged you.
     *
     * @summary Get all WhatsApp contacts
     */
    SDK.prototype.postInstancesIdClientActionGetContacts = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-contacts', 'post', metadata);
    };
    /**
     * Converts a phone number into the proper WhatsApp chat ID format. This is especially
     * useful for countries that don't follow the standard chat ID format (like Brazil, Mexico
     * and Argentina). The endpoint ensures you get the correct chat ID for any phone number.
     *
     * @summary Get WhatsApp chat ID from phone number
     */
    SDK.prototype.postInstancesIdClientActionGetNumberId = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-number-id', 'post', body, metadata);
    };
    /**
     * Get the country code for a given phone number
     *
     * @summary get country code
     */
    SDK.prototype.postInstancesIdClientActionGetCountryCode = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-country-code', 'post', body, metadata);
    };
    /**
     * Format a phone number into standardized format
     *
     * @summary get formatted number
     */
    SDK.prototype.postInstancesIdClientActionGetFormattedNumber = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-formatted-number', 'post', body, metadata);
    };
    /**
     * Check if a given contactId is registered.
     *
     * @summary is registered user
     */
    SDK.prototype.postInstancesIdClientActionIsRegisteredUser = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/is-registered-user', 'post', body, metadata);
    };
    /**
     * Creates and sends an interactive poll message to a specified chat. The poll can have
     * between 2-12 options and optionally allow multiple selections.
     *
     * @summary Create Poll Message
     */
    SDK.prototype.postInstancesIdClientActionCreatePoll = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/create-poll', 'post', body, metadata);
    };
    /**
     * Retrieves all available WhatsApp stories/status updates that are visible to the
     * authenticated user. This includes both viewed and unviewed stories from contacts.
     *
     * @summary Get WhatsApp Stories
     */
    SDK.prototype.postInstancesIdClientActionGetStories = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-stories', 'post', metadata);
    };
    /**
     * Retrieves the profile picture URL for a contact, chat, group, or newsletter. Access is
     * subject to privacy settings. Use appropriate suffixes: @c.us for contacts/chats, @g.us
     * for groups, @newsletter for newsletters.
     *
     * @summary Get Profile Picture URL
     */
    SDK.prototype.postInstancesIdClientActionGetProfilePicUrl = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-profile-pic-url', 'post', body, metadata);
    };
    /**
     * Retrieves detailed contact information for a specific WhatsApp contact using their ID.
     * Returns contact details including name, number, business status, and various contact
     * flags.
     *
     * @summary Get Contact Details by ID
     */
    SDK.prototype.postInstancesIdClientActionGetContactById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-contact-by-id', 'post', body, metadata);
    };
    /**
     * Blocks a WhatsApp contact, preventing them from sending messages to the authenticated
     * user. The contact will not be able to see the user's last seen, online status, or status
     * updates.
     *
     * @summary Block a WhatsApp Contact
     */
    SDK.prototype.postInstancesIdClientActionBlockContact = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/block-contact', 'post', body, metadata);
    };
    /**
     * Removes a contact from the blocked contacts list, allowing them to send messages and see
     * your information again according to your privacy settings.
     *
     * @summary Unblock a WhatsApp Contact
     */
    SDK.prototype.postInstancesIdClientActionUnblockContact = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unblock-contact', 'post', body, metadata);
    };
    /**
     * Retrieves a list of all blocked contacts
     *
     * @summary Get blocked contacts
     */
    SDK.prototype.postInstancesIdClientActionGetBlockedContacts = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-blocked-contacts', 'post', metadata);
    };
    /**
     * Get list of groups that are in common between you and the specified contact
     *
     * @summary Get common groups with contact
     */
    SDK.prototype.postInstancesIdClientActionGetCommonGroups = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-common-groups', 'post', body, metadata);
    };
    /**
     * Retrieves the about/status info for a specific contact
     *
     * @summary Get contact about info
     */
    SDK.prototype.postInstancesIdClientActionGetContactAboutInfo = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-contact-about-info', 'post', body, metadata);
    };
    /**
     * Get chat by ID
     *
     * @summary get chat by id
     */
    SDK.prototype.postInstancesIdClientActionGetChatById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-chat-by-id', 'post', body, metadata);
    };
    /**
     * Delete chat by ID
     *
     * @summary delete chat by id
     */
    SDK.prototype.postInstancesIdClientActionDeleteChatById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/delete-chat-by-id', 'post', body, metadata);
    };
    /**
     * Creates a new WhatsApp group with specified name and participants
     *
     * @summary Create Group
     */
    SDK.prototype.postInstancesIdClientActionCreateGroup = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/create-group', 'post', body, metadata);
    };
    /**
     * Get group participants
     *
     * @summary get group participants
     */
    SDK.prototype.postInstancesIdClientActionGetGroupParticipants = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-group-participants', 'post', body, metadata);
    };
    /**
     * Get group info
     *
     * @summary get group info
     */
    SDK.prototype.postInstancesIdClientActionGetGroupInfo = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-group-info', 'post', body, metadata);
    };
    /**
     * Get reactions for a specific message
     *
     * @summary get message reactions
     */
    SDK.prototype.postInstancesIdClientActionGetReactions = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-reactions', 'post', body, metadata);
    };
    /**
     * Add or remove a reaction emoji to/from a message
     *
     * @summary react to message
     */
    SDK.prototype.postInstancesIdClientActionReactToMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/react-to-message', 'post', body, metadata);
    };
    /**
     * Update Group Information
     *
     * @summary update group info
     */
    SDK.prototype.postInstancesIdClientActionUpdateGroupInfo = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/update-group-info', 'post', body, metadata);
    };
    /**
     * Get mentions from a message
     *
     * @summary get message mentions
     */
    SDK.prototype.postInstancesIdClientActionGetMessageMentions = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-message-mentions', 'post', body, metadata);
    };
    /**
     * Pin a message in a chat
     *
     * @summary pin message
     */
    SDK.prototype.postInstancesIdClientActionPinMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/pin-message', 'post', body, metadata);
    };
    /**
     * Unpin a message in a chat
     *
     * @summary unpin message
     */
    SDK.prototype.postInstancesIdClientActionUnpinMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unpin-message', 'post', body, metadata);
    };
    /**
     * Star a message by its ID
     *
     * @summary star message
     */
    SDK.prototype.postInstancesIdClientActionStarMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/star-message', 'post', body, metadata);
    };
    /**
     * Remove star from a message
     *
     * @summary unstar message
     */
    SDK.prototype.postInstancesIdClientActionUnstarMessage = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unstar-message', 'post', body, metadata);
    };
    /**
     * Update Group Settings
     *
     * @summary update group settings
     */
    SDK.prototype.postInstancesIdClientActionUpdateGroupSettings = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/update-group-settings', 'post', body, metadata);
    };
    /**
     * Add a participant to a group
     *
     * @summary add group participant
     */
    SDK.prototype.postInstancesIdClientActionAddGroupParticipant = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/add-group-participant', 'post', body, metadata);
    };
    /**
     * Remove a participant from a group
     *
     * @summary remove group participant
     */
    SDK.prototype.postInstancesIdClientActionRemoveGroupParticipant = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/remove-group-participant', 'post', body, metadata);
    };
    /**
     * Promote a participant to admin
     *
     * @summary promote group participant
     */
    SDK.prototype.postInstancesIdClientActionPromoteGroupParticipant = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/promote-group-participant', 'post', body, metadata);
    };
    /**
     * Demote a participant from admin to normal participant
     *
     * @summary demote group participant
     */
    SDK.prototype.postInstancesIdClientActionDemoteGroupParticipant = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/demote-group-participant', 'post', body, metadata);
    };
    /**
     * Approve pending group membership requests
     *
     * @summary approve group membership requests
     */
    SDK.prototype.postInstancesIdClientActionAcceptGroupMemberRequests = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/accept-group-member-requests', 'post', body, metadata);
    };
    /**
     * Deny pending group membership requests
     *
     * @summary deny group membership requests
     */
    SDK.prototype.postInstancesIdClientActionDenyGroupMemberRequests = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/deny-group-member-requests', 'post', body, metadata);
    };
    /**
     * Get pending group membership requests
     *
     * @summary get group membership requests
     */
    SDK.prototype.postInstancesIdClientActionGetGroupMemberRequests = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-group-member-requests', 'post', body, metadata);
    };
    /**
     * Accept a WhatsApp group invite using an invite code
     *
     * @summary accept group invite
     */
    SDK.prototype.postInstancesIdClientActionAcceptInvite = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/accept-invite', 'post', body, metadata);
    };
    /**
     * Get information about a group invite code
     *
     * @summary get group invite info
     */
    SDK.prototype.postInstancesIdClientActionGetInviteInfo = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-invite-info', 'post', body, metadata);
    };
    /**
     * Create a channel
     *
     * @summary create a channel
     */
    SDK.prototype.postInstancesIdClientActionCreateChannel = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/create-channel', 'post', body, metadata);
    };
    /**
     * get your channels
     *
     * @summary get channels
     */
    SDK.prototype.postInstancesIdClientActionGetChannels = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-channels', 'post', metadata);
    };
    /**
     * get channel by id
     *
     * @summary get channel by id
     */
    SDK.prototype.postInstancesIdClientActionGetChannelById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-channel-by-id', 'post', body, metadata);
    };
    /**
     * subscribe to channel
     *
     * @summary subscribe to channel
     */
    SDK.prototype.postInstancesIdClientActionSubscribeToChannel = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/subscribe-to-channel', 'post', body, metadata);
    };
    /**
     * unsubscribe from channel
     *
     * @summary unsubscribe from channel
     */
    SDK.prototype.postInstancesIdClientActionUnsubscribeFromChannel = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unsubscribe-from-channel', 'post', body, metadata);
    };
    /**
     * Search for WhatsApp channels
     *
     * @summary search channels
     */
    SDK.prototype.postInstancesIdClientActionSearchChannels = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/search-channels', 'post', body, metadata);
    };
    /**
     * archive chat
     *
     * @summary archive chat
     */
    SDK.prototype.postInstancesIdClientActionArchiveChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/archive-chat', 'post', body, metadata);
    };
    /**
     * unarchive chat
     *
     * @summary unarchive chat
     */
    SDK.prototype.postInstancesIdClientActionUnarchiveChat = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/unarchive-chat', 'post', body, metadata);
    };
    /**
     * get all labels
     *
     */
    SDK.prototype.postInstancesIdClientActionGetLabels = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-labels', 'post', metadata);
    };
    /**
     * Get label by ID
     *
     * @summary get label by id
     */
    SDK.prototype.postInstancesIdClientActionGetLabelById = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-label-by-id', 'post', body, metadata);
    };
    /**
     * Get chat labels by chat ID
     *
     * @summary get chat labels
     */
    SDK.prototype.postInstancesIdClientActionGetChatLabels = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-chat-labels', 'post', body, metadata);
    };
    /**
     * Get chats by label ID
     *
     * @summary get chats by labelId
     */
    SDK.prototype.postInstancesIdClientActionGetChatsByLabelId = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/get-chats-by-label-id', 'post', body, metadata);
    };
    /**
     * Logs out the client, closing the current session
     *
     * @summary logout
     */
    SDK.prototype.postInstancesIdClientActionLogout = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/logout', 'post', metadata);
    };
    /**
     * Reboots your WhatsApp instance. This will close the current session and restart the
     * client. The instance will need to be re-authenticated if it was previously logged in.
     *
     * @summary Reboot Instance
     */
    SDK.prototype.postInstancesIdClientActionReboot = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/reboot', 'post', metadata);
    };
    /**
     * Sets the client's presence status to 'available'/'online'
     *
     * @summary Send presence available
     */
    SDK.prototype.postInstancesIdClientActionSendPresenceAvailable = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-presence-available', 'post', metadata);
    };
    /**
     * Sets the WhatsApp status text for the connected account
     *
     * @summary Set WhatsApp status
     */
    SDK.prototype.postInstancesIdClientActionSetStatus = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/set-status', 'post', body, metadata);
    };
    /**
     * Sets the display name for the WhatsApp account
     *
     * @summary Set display name
     */
    SDK.prototype.postInstancesIdClientActionSetDisplayName = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/set-display-name', 'post', body, metadata);
    };
    /**
     * Request a WhatsApp pairing code for phone number registration. To prevent abuse and
     * ensure system stability, pairing code requests are limited to 2 per minute. Multiple
     * rapid requests may indicate automated abuse attempts to Whatsapp.
     *
     * @summary Request Pairing Code
     */
    SDK.prototype.postInstancesIdClientActionRequestPairingCode = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/request-pairing-code', 'post', body, metadata);
    };
    /**
     * Sends typing state indicator to a chat
     *
     * @summary Send typing state
     */
    SDK.prototype.postInstancesIdClientActionSendTyping = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-typing', 'post', body, metadata);
    };
    /**
     * Clears all messages from a specific chat
     *
     * @summary Clear chat messages
     */
    SDK.prototype.postInstancesIdClientActionClearChatMessages = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/clear-chat-messages', 'post', body, metadata);
    };
    /**
     * Synchronizes the chat history for a specific chat
     *
     * @summary Sync chat history
     */
    SDK.prototype.postInstancesIdClientActionSyncChatHistory = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/sync-chat-history', 'post', body, metadata);
    };
    /**
     * Stops the typing indicator for a chat
     *
     * @summary Stop typing indicator
     */
    SDK.prototype.postInstancesIdClientActionSendStopTyping = function (body, metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-stop-typing', 'post', body, metadata);
    };
    /**
     * Sets the client's presence status to 'unavailable'/'offline'
     *
     * @summary Send presence unavailable
     */
    SDK.prototype.postInstancesIdClientActionSendPresenceUnavailable = function (metadata) {
        return this.core.fetch('/instances/{id}/client/action/send-presence-unavailable', 'post', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
