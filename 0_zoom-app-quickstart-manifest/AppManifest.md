## Zoom App Manifest configuration

Replace any placeholder URL such as https://example.ngrok.io with your actual ngrok-generated URL.

```
{
    "manifest": {
        "display_information": {
            "display_name": "Zoom Apps Next.js Sample App"
        },
        "oauth_information": {
            "usage": "USER_OPERATION",
            "development_redirect_uri": "https://example.ngrok.io/auth/callback",
            "production_redirect_uri": "",
            "oauth_allow_list": [
                "https://example-backend.ngrok.io/auth/v1/callback",
                "https://oauth.pstmn.io/v1/callback",
                "https://example.ngrok.io/auth/callback"
            ],
            "strict_mode": false,
            "subdomain_strict_mode": false,
            "scopes": [
                {
                    "scope": "marketplace:read:app",
                    "optional": false
                },
                {
                    "scope": "user:read:user",
                    "optional": false
                },
                {
                    "scope": "zoomapp:inmeeting",
                    "optional": false
                },
                {
                    "scope": "imchat:userapp",
                    "optional": false
                }
            ]
        },
        "features": {
            "products": [
                "ZOOM_CHAT",
                "ZOOM_MEETING"
            ],
            "development_home_uri": "https://example.ngrok.io",
            "production_home_uri": "",
            "domain_allow_list": [
                {
                    "domain": "appssdk.zoom.us",
                    "explanation": ""
                },
                {
                    "domain": "ngrok.io",
                    "explanation": ""
                }
            ],
            "in_client_feature": {
                "zoom_app_api": {
                    "enable": false,
                    "zoom_app_apis": []
                },
                "guest_mode": {
                    "enable": false,
                    "enable_test_guest_mode": false
                },
                "in_client_oauth": {
                    "enable": false
                },
                "collaborate_mode": {
                    "enable": false,
                    "enable_screen_sharing": false,
                    "enable_play_together": false,
                    "enable_start_immediately": false,
                    "enable_join_immediately": false
                }
            },
            "zoom_client_support": {
                "mobile": {
                    "enable": false
                },
                "zoom_room": {
                    "enable": false,
                    "enable_personal_zoom_room": false,
                    "enable_shared_zoom_room": false,
                    "enable_digital_signage": false,
                    "enable_zoom_rooms_controller": false
                },
                "pwa_client": {
                    "enable": false
                }
            },
            "embed": {
                "meeting_sdk": {
                    "enable": false,
                    "enable_device": false,
                    "devices": []
                },
                "contact_center_sdk": {
                    "enable": false
                },
                "phone_sdk": {
                    "enable": false
                }
            },
            "team_chat_subscription": {
                "enable": true,
                "enable_support_channel": false,
                "slash_command": {
                    "command": "hello_world",
                    "command_hints": [],
                    "enable_add_to_channel": false,
                    "development_message_url": "https://example.ngrok.io/api/zoom/webhooks/chatbot",
                    "production_message_url": "",
                    "sender_type": "zoom",
                    "welcome_msg": {
                        "title": "",
                        "body": ""
                    },
                    "trust_domain_list": []
                },
                "shortcuts": [
                    {
                        "shortcut_id": "",
                        "action_label": "Open App",
                        "action_id": "app_opened",
                        "action_types": [
                            "MESSAGE_ACTION",
                            "COMPOSE_BOX"
                        ],
                        "action_usage": "DIALOG",
                        "dialog_config": {
                            "title": "create_message",
                            "size": "M"
                        }
                    }
                ]
            },
            "event_subscription": {
                "enable": false,
                "events": []
            }
        }
    }
}
```