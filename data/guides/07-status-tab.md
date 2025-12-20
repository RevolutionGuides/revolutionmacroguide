# Status Tab

## Logs ![](./assets/status-logs-controls.png)

- **Show Console**: Shows the console for commands you can enter
- **Log Level**: Set to **4** for maximum verbose logging (debugging only). Keep at **0** if you aren’t experienced
- **Copy Logs**: Copies logs so you can send them in Discord for Support Staff to assist you
- **Open Logs Folder**: Opens the logs folder in your File Explorer / Finder
- **Clear Logs**: Clears all logs

---

## Webhook Tutorial *(Recommended)*

How to connect your macro to a Discord Webhook.

1. Make a new Discord server
2. Edit / press the **gear icon** on the `general` text channel
3. Go to **Integrations** → **Webhooks** → create a new webhook
4. Copy the **Webhook URL**
5. Open **Revolution Macro** and paste the URL in:
   - **Status tab → Webhook**
6. *(Optional)* Add your Discord ID for pings if something goes wrong
   - Enable **Developer Mode** in Discord
   - Copy your ID and paste it into the macro under Webhooks
7. Hourly graphs are automatically processed and sent via webhook

---

## Bot Tutorial  
*(Webhook is easier and recommended)*

How to set up the Revolution Macro Discord bot.

1. Create a new Discord bot with the correct permissions and add it to your server  
   *(online guides can help with this step)*
2. Copy the **Bot Token** and paste it into:
   - **Status tab → Bot → Bot Token**
3. Set the **Bot Channel** to your server’s logging channel
4. Command prefix can remain the same
5. Enable **Slash Commands** for easier usage
6. Run `/report` for an instant hourly graph report  
   - Hourly graphs are sent automatically

---

## Statistics

- **Work in Progress**
