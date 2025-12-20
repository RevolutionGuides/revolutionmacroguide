# Gather Tab TEST

## Fields

To edit a field, click the **pen icon**.  
To paste pre-made settings, click the **6 dots icon** and select **"Paste"**.

### Editing the Field

- Suggested to copy and paste pre-made settings from the Revolution Discord → `#patterns-configs`
- Verify **Max Backpack Capacity** is set to **95% or less**
- **Disable Drift Detection** (uses Supreme Saturator to align character):
  - Click the **pen icon**
  - Click **"align"** located under **Max Backpack** → disable
  - Shiftlock is in the **"misc"** tab next to **"align"**
- **Walk or reset to hive**:
  - Controlled by the **Skull Symbol** and **Person walking switch**
  - This is a **per-field setting**

---

## Boosts

- Make sure your **sprinkler is in slot 1**
- Configure **slots 2–7** to your liking
- Choose a buff by clicking the big **"+"** or selecting an item in your hotbar

---

## Settings

### General

| Setting | Purpose |
| --- | --- |
| **Sprinkler Type** | Set sprinkler type to your current sprinkler in Bee Swarm |
| **Use Fast Pine Return Path** | If you are blue and macro in Pine Tree and have good FPS, enable this. When enabled, the macro will use the Blue Cannon to return when converting |
| **Disable Gathering** | Waits for tasks and prevents the macro from farming honey (useful for quests) |
| **Use Dipper** | Autoclicks your mouse |
| **Inactive Honey Timeout** | Maximum seconds before the macro stops gathering if no honey is being made. Default is 10 seconds. Recommended to set to 8 seconds |
| **Full Bag Timeout** | Maximum seconds before stopping gathering if your capacity (aka. backpack) is full |

---

### Conversion

| Setting | Purpose |
| --- | --- |
| **Minimum Blessing** | Minimum balloon blessing needed at hive for the macro to convert the balloon |
| **Minimum Minutes** | Minimum minutes to wait before going back to hive to convert. When backpack is full, this limit is ignored |
| **Maximum Minutes** | Maximum minutes to wait before going back to hive to convert. If set to 0, the macro will always go to hive to convert after gathering |
| **Minimum Backpack** | Minimum threshold of how full backpack must be before the macro converts it all to honey |
| **Maximum Backpack** | Maximum threshold of how full backpack can be, after which the macro converts all of it to honey |
| **Finish Conversion After Balloon Refresh** | If enabled, the macro will stop converting as soon as balloon blessing is refreshed (Recommended) |

---

## Field Defaults

Don’t bother touching.

---

## AI Gather

### Settings

| Setting | Purpose |
| --- | --- |
| **Maximum Model FPS** | Maximum number of frames the AI will predict where tokens are. Decreasing this will decrease load on GPU, but also token collection accuracy |
| **Use Full Model** | Whether or not to use an unoptimized version of the model. Enable if the current model isn’t working for you |
| **Loot Mode** | Enabling will optimize the AI to gather loot like fruits |
| **Eco Mode** | Reduces resource usage |

---

### Token Priority

- Customizable to your liking
- **Token Link** or **Loot** is a must-have at the top
