// Example templates for different use cases

// 1. Welcome Message Template
const welcomeTemplate = {
    name: "welcome_message",
    category: "MARKETING",
    language: "en",
    components: [
        {
            type: "HEADER",
            format: "TEXT",
            text: "Welcome to Our Service! 🎉"
        },
        {
            type: "BODY",
            text: "Hello {{name}}, thank you for joining us! We're excited to have you on board. Your account has been successfully created."
        },
        {
            type: "BUTTONS",
            buttons: [
                {
                    type: "QUICK_REPLY",
                    text: "Get Started"
                },
                {
                    type: "URL",
                    text: "Visit Website",
                    url: "https://example.com"
                }
            ]
        }
    ]
};

// 2. Order Confirmation Template
const orderConfirmationTemplate = {
    name: "order_confirmation",
    category: "UTILITY",
    language: "en",
    components: [
        {
            type: "HEADER",
            format: "TEXT",
            text: "Order Confirmed! 🛍️"
        },
        {
            type: "BODY",
            text: "Dear {{name}}, your order #{{order_id}} has been confirmed. Total amount: {{amount}}. Expected delivery: {{delivery_date}}."
        },
        {
            type: "BUTTONS",
            buttons: [
                {
                    type: "URL",
                    text: "Track Order",
                    url: "https://example.com/track/{{order_id}}"
                },
                {
                    type: "QUICK_REPLY",
                    text: "Contact Support"
                }
            ]
        }
    ]
};

// 3. Appointment Reminder Template
const appointmentReminderTemplate = {
    name: "appointment_reminder",
    category: "UTILITY",
    language: "en",
    components: [
        {
            type: "HEADER",
            format: "TEXT",
            text: "Appointment Reminder ⏰"
        },
        {
            type: "BODY",
            text: "Hello {{name}}, this is a reminder for your appointment with {{doctor_name}} on {{date}} at {{time}}. Please arrive 15 minutes early."
        },
        {
            type: "BUTTONS",
            buttons: [
                {
                    type: "QUICK_REPLY",
                    text: "Confirm"
                },
                {
                    type: "QUICK_REPLY",
                    text: "Reschedule"
                },
                {
                    type: "PHONE_NUMBER",
                    text: "Call Clinic",
                    phoneNumber: "+1234567890"
                }
            ]
        }
    ]
};

// 4. Password Reset Template
const passwordResetTemplate = {
    name: "password_reset",
    category: "AUTHENTICATION",
    language: "en",
    components: [
        {
            type: "HEADER",
            format: "TEXT",
            text: "Password Reset Request 🔐"
        },
        {
            type: "BODY",
            text: "Hello {{name}}, we received a request to reset your password. Your verification code is: {{code}}. This code will expire in 10 minutes."
        },
        {
            type: "BUTTONS",
            buttons: [
                {
                    type: "COPY_CODE",
                    text: "Copy Code"
                },
                {
                    type: "URL",
                    text: "Reset Password",
                    url: "https://example.com/reset-password"
                }
            ]
        }
    ]
};

// 5. Event Invitation Template
const eventInvitationTemplate = {
    name: "event_invitation",
    category: "MARKETING",
    language: "en",
    components: [
        {
            type: "HEADER",
            format: "IMAGE",
            text: "Event Invitation"
        },
        {
            type: "BODY",
            text: "Hello {{name}}, you're invited to {{event_name}}! Date: {{date}} Time: {{time}} Location: {{location}}"
        },
        {
            type: "BUTTONS",
            buttons: [
                {
                    type: "QUICK_REPLY",
                    text: "I'll Attend"
                },
                {
                    type: "QUICK_REPLY",
                    text: "Can't Make It"
                },
                {
                    type: "URL",
                    text: "View Details",
                    url: "https://example.com/event/{{event_id}}"
                }
            ]
        }
    ]
};

module.exports = {
    welcomeTemplate,
    orderConfirmationTemplate,
    appointmentReminderTemplate,
    passwordResetTemplate,
    eventInvitationTemplate
}; 