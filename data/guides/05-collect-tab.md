# Collect Tab

The Collect Tab manages honey conversion, collection, and related automation.

## General Conversion Settings

| Setting                          | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| **Convert At**                   | Honey percentage threshold for conversion (default: 95%)    |
| **Convert**                      | Toggle honey conversion on/off                              |
| **Convert On Full**              | Forces conversion when backpack is full, ignoring threshold |
| **Convert With 0 Honey**         | Triggers conversion when you have 0 honey (not recommended) |
| **Convert With 0 Honey Timeout** | Seconds before forced 0-honey conversion                    |
| **Reset After Convert**          | Automatically resets position after conversion completes    |

## Conversion Method

Choose ONE conversion method for your hive setup:

| Option                  | Use When                                                |
| ----------------------- | ------------------------------------------------------- |
| **Use Converter**       | You have a standard converter in your hive              |
| **Use Micro Converter** | You're using a micro converter (faster, more efficient) |
| **Use Balloon**         | You're using a balloon transport system                 |

## Snowflakes Collection

- **Gather Snowflakes**: Automatically collects snowflakes during gathering
- Useful during winter events
- Can be toggled on/off independently

## Puff Automation

Configure automatic puff collection if you use planters:

| Setting                   | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| **Enabled**               | Toggles puff collection                           |
| **Puff Planter Type**     | Type of planter used for puffs                    |
| **Puff Planter Field**    | Which field your puff planter is placed in        |
| **Puff Planter Interval** | How often to check and collect puffs (in seconds) |

## Optimization Tips

### Conversion Timing

- **95% threshold** works well for most hive types
- Lower threshold = more frequent conversions = less downtime
- Higher threshold = fewer conversions = risk of overflow

### Choosing Conversion Method

1. **Standard Converter**: Most common, standard speed
2. **Micro Converter**: Faster if you have room for it
3. **Balloon**: Experimental, may require tweaking

### Puff Collection

- Enable if you have spare planter space
- Set interval based on planter respawn rate
- Test with small interval first, then optimize

## Common Issues

### "Conversion fails to trigger"

- Verify you selected a conversion method
- Check your converter/balloon is accessible
- Ensure honey percentage is above threshold

### "Puff collection not working"

- Confirm puff planter is in the correct field
- Check that collection interval isn't too short
- Verify planter type is correctly set
