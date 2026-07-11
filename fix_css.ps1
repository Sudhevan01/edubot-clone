$file = 'c:\Users\abdulrazak\Desktop\vvv\educrop-landingpage\src\pages\Homepage.css'
$lines = Get-Content $file
$first = $lines[0..824]
$last = $lines[1328..($lines.Count-1)]

$middle = @"
.subcard-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Icon Hover Animations */
.subcard:hover .animated-icon-sparkles svg {
  animation: sparkle-pulse-rotate 1.2s ease-in-out infinite;
}

.subcard:hover .animated-icon-users svg {
  animation: users-bounce-scale 1.2s ease-in-out infinite;
}

.subcard:hover .animated-icon-globe svg {
  animation: globe-slow-spin 4s linear infinite;
}

@keyframes sparkle-pulse-rotate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(15deg); }
}

@keyframes users-bounce-scale {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.15); }
}

@keyframes globe-slow-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Animations */
@keyframes float-up-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes float-down-up {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

/* Responsive Rules */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .landing-hero {
    grid-template-columns: 1fr;
    padding: 60px 5%;
    gap: 80px;
    text-align: center;
  }
  .hero-left { align-items: center; margin: 0 auto; }
  .hero-title { align-items: center; margin: 0 auto; }
  .hero-actions { justify-content: center; }
  .hero-right { margin-top: 20px; justify-content: center; }
  .classroom-img-container { max-width: 440px; }
  .support-grid-new { grid-template-columns: 1fr; gap: 32px; padding: 0 4%; }
}

@media (max-width: 820px) {
  .landing-header { height: 70px; }
  .landing-logo-img { height: 52px; }
  .mobile-nav-panel { top: 70px; }
  .hero-right { height: 280px; }
  .landing-nav { display: none; }
  .mobile-menu-btn { display: block; }
  .hero-actions { flex-direction: column; width: 100%; max-width: 320px; margin: 0 auto; }
  .btn-explore, .btn-demo { width: 100%; justify-content: center; }
  .card-data-insight { left: auto; right: 10px; transform: none; width: 170px; padding: 12px 16px; }
  .card-stats { left: auto; right: 210px; transform: none; width: 170px; padding: 12px 16px; gap: 12px; }
  .stat-val { font-size: 15px; }
  .landing-page .card-white-split { grid-template-columns: 1fr; gap: 24px; }
  .card-image-box { max-height: 240px; }
}

@media (max-width: 540px) {
  .landing-header { height: 60px; }
  .landing-logo-img { height: 44px; }
  .mobile-nav-panel { top: 60px; }
  .hero-right { height: 140px; }
  .hero-desc { font-size: 13px; margin-bottom: 12px; }
  .hero-actions { flex-direction: row; gap: 10px; width: 100%; max-width: 100%; justify-content: center; padding: 0 40px; }
  .btn-explore, .btn-demo { padding: 10px 14px; font-size: 12px; width: auto; }
  .classroom-img-container { max-width: 100%; aspect-ratio: 16/9; }
  .card-data-insight, .card-stats { bottom: -20px; padding: 10px 12px; width: 135px; }
  .card-data-insight { left: auto; right: calc(50% - 150px); transform: none; }
  .card-stats { left: auto; right: calc(50% + 15px); transform: none; gap: 8px; }
  .card-white, .card-blue { padding: 24px; }
}

@media (max-width: 360px) {
  .landing-header { height: 56px; }
  .landing-logo-img { height: 38px; }
  .mobile-nav-panel { top: 56px; }
  .hero-actions { padding: 0 36px; gap: 8px; }
  .btn-explore, .btn-demo { padding: 9px 12px; font-size: 11.5px; }
  .card-data-insight, .card-stats { bottom: -20px; width: 120px; padding: 8px 10px; gap: 2px; }
  .card-data-insight { left: auto; right: calc(50% - 135px); transform: none; }
  .card-stats { left: auto; right: calc(50% + 15px); transform: none; }
  .stat-val { font-size: 10px; }
  .stat-lbl { font-size: 8px; }
}
"@

$middleLines = $middle -split "`n"
$all = $first + $middleLines + $last
$content = $all -join "`r`n"
[System.IO.File]::WriteAllText($file, $content)
Write-Host "Done. Total lines: $($all.Count)"
