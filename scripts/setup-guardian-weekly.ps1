# 本机每周自动跑文化链接守护（与 GitHub Actions 标准一致）
$projectRoot = Split-Path -Parent $PSScriptRoot
$action = New-ScheduledTaskAction -Execute "npm.cmd" -Argument "run guardian" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 11:00AM
Register-ScheduledTask -TaskName "CrossCultureMap-Guardian" -Action $action -Trigger $trigger -Force | Out-Null
Write-Host "已注册每周一 11:00 自动巡检换链: CrossCultureMap-Guardian"
