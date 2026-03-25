' Add a random startup delay between 1 and 15 minutes to evade detection
' Randomize
' delayMinutes = Int((15 - 1 + 1) * Rnd + 1)
' WScript.Sleep delayMinutes * 60 * 1000

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "c:\Users\ashok kumar\naukri-auto-update-resume\run.bat" & Chr(34), 0
Set WshShell = Nothing