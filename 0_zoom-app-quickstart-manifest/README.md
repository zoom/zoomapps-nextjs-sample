##  Zoom App Manifest configuration

This guide shows how to create a general app with a pre-defined configuration a Zoom Contact Center App app using the **App Manifest API**.

### Set up local developer env with Ngrok (reverse proxy)
Zoom Apps do not support localhost, and must be served over https. To develop locally, you need to tunnel traffic to this application via https. Usually ngrok allows forwarding a single port, but if you add the following to your ngrok configuration file, you can serve up both with a single command. 

```bash
$ ngrok config edit
```

```
version: 3
agent:
    authtoken: {YOUR_AUTH_TOKEN}
endpoints:
    - name: express
      url: example.ngrok.io
      upstream:
          url: 3000
    - name: nextjs
      url: example.ngrok.io
      upstream:
          url: 3000
    - name: supabase
      url: example-backend.ngrok.io
      upstream:
          url: 54321
```
You can use the following example ngrok [configuration file](https://gist.github.com/just-zoomit/d07f988c54d89f71fcc6b2643aa1223c) as a reference:


```bash
$ ngrok start nextjs supabase
```

Ngrok will output the origin it has created for your tunnels, eg https://9a20-38-99-100-7.ngrok.io. You'll need to use the https origin from the Ngrok terminal output or what tunnel service of your when testing locally. 

![HTTPS tunnel](/assets/ngrok-https-tunnel.png)

In the pre-defined configuration below, replace all instances of `example.ngrok.app` with your actual ngrok domain.

---

### Create and configure Marketplace App

1. Navigate to the [Zoom Makertplace](https://marketplace.zoom.us/develop/create), create a general app, and take note of credentials you will need them for making API request. 

2. On the Scope page, select the following:
     * Edit marketplace app 
     * View marketplace app information for the account

3. Use the [Update an app by manifest](https://developers.zoom.us/docs/api/marketplace/#tag/manifest/put/marketplace/apps/{appId}/manifest) endpoint to quickly configure a Zoom Marketplace app.

## Example request
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