# System tray icon for the presence companion (Windows).
# Started by src/server.js. Talks only to the local control server on 127.0.0.1.
param(
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][string]$Name,
  [Parameter(Mandatory = $true)][string]$Icon,
  [Parameter(Mandatory = $true)][int]$ServerPid
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# One tray icon per app: a second copy exits quietly.
$created = $false
$mutex = New-Object System.Threading.Mutex($true, "Local\$($Name -replace '\W', '')-tray-$Port", [ref]$created)
if (-not $created) { exit 0 }

$origin = "http://127.0.0.1:$Port"

function Get-Status {
  try { return Invoke-RestMethod -Uri "$origin/api/status" -TimeoutSec 2 -UseBasicParsing }
  catch { return $null }
}
function Send-Post([string]$path, [hashtable]$body) {
  try {
    Invoke-RestMethod -Uri "$origin$path" -Method Post -TimeoutSec 4 -UseBasicParsing `
      -Headers @{ Origin = $origin } -ContentType 'application/json' `
      -Body ($body | ConvertTo-Json -Compress) | Out-Null
    return $true
  } catch {
    $tray.ShowBalloonTip(4000, $Name, "That didn't work: $($_.Exception.Message)", [System.Windows.Forms.ToolTipIcon]::Warning)
    return $false
  }
}
function Open-Panel { Start-Process "$origin/" }

$tray = New-Object System.Windows.Forms.NotifyIcon
if (Test-Path -LiteralPath $Icon) { $tray.Icon = New-Object System.Drawing.Icon($Icon) }
else { $tray.Icon = [System.Drawing.SystemIcons]::Application }
$tray.Text = $Name
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$title = $menu.Items.Add($Name); $title.Enabled = $false
$status = $menu.Items.Add('Starting...'); $status.Enabled = $false
[void]$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))
$open = $menu.Items.Add('Open control panel')
$start = $menu.Items.Add('Start session')
$auto = $menu.Items.Add('Automatic')
$stop = $menu.Items.Add('Stop sharing')
[void]$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))
$quit = $menu.Items.Add('Quit app')
$tray.ContextMenuStrip = $menu

$open.add_Click({ Open-Panel })
$tray.add_DoubleClick({ Open-Panel })
$start.add_Click({ if (Send-Post '/api/mode' @{ mode = 'manual' }) { Update-Status } })
$auto.add_Click({ if (Send-Post '/api/mode' @{ mode = 'auto' }) { Update-Status } })
$stop.add_Click({ if (Send-Post '/api/mode' @{ mode = 'off' }) { Update-Status } })
$quit.add_Click({
  [void](Send-Post '/api/quit' @{})
  $timer.Stop(); $tray.Visible = $false; $tray.Dispose()
  [System.Windows.Forms.Application]::Exit()
})

function Update-Status {
  $s = Get-Status
  if ($null -eq $s) {
    # The server is gone (quit from the web page, crash or shutdown): remove the icon.
    if (-not (Get-Process -Id $ServerPid -ErrorAction SilentlyContinue)) {
      $timer.Stop(); $tray.Visible = $false; $tray.Dispose()
      [System.Windows.Forms.Application]::Exit()
    }
    return
  }
  $mode = [string]$s.mode
  $label = switch ($mode) { 'auto' { 'Automatic' } 'manual' { 'Sharing (manual)' } default { 'Not sharing' } }
  if ($s.published) { $label += ' - live on Discord' }
  $status.Text = $label
  $start.Checked = ($mode -eq 'manual')
  $auto.Checked = ($mode -eq 'auto')
  $stop.Checked = ($mode -eq 'off')
  $tip = "$Name - $label"
  if ($tip.Length -gt 63) { $tip = $tip.Substring(0, 63) }
  $tray.Text = $tip
}

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000
$timer.add_Tick({ Update-Status })
$timer.Start()
Update-Status

[System.Windows.Forms.Application]::Run()
$mutex.ReleaseMutex()
