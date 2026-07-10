import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Monitor, Smartphone, CheckCircle, Info, Menu, X } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import './Downloads.css';

const Downloads = ({ onLoginClick }) => {
  const navigate = useNavigate();


  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const downloadItems = [
    {
      type: 'desktop',
      title: 'EduCrop Desktop Client',
      platform: 'Windows Setup (.exe)',
      icon: <Monitor size={48} className="platform-icon desktop" />,
      description: 'The native Windows application designed for front-desk receptionists, administration staff, and accountants. Provides automated printing support, gatepass scanning, and offline logs sync.',
      fileName: 'educrop-setup.exe',
      downloadUrl: '/downloads/educrop-setup.exe',
      alternateFileName: 'EduCrop_VMS.exe',
      alternateDownloadUrl: '/downloads/EduCrop_VMS.exe',
      size: '54.2 MB',
      version: 'v2.1.0',
      requirements: 'Windows 10 / 11 (64-bit)'
    },
    {
      type: 'mobile',
      title: 'EduCrop Mobile App',
      platform: 'Android App (.apk)',
      icon: <Smartphone size={48} className="platform-icon mobile" />,
      description: 'The mobile companion application optimized for gate guard checkpoint scanners, teachers, and field operators. Allows scanning QR gatepasses using the device camera.',
      fileName: 'educrop-mobile.apk',
      downloadUrl: '/downloads/educrop-mobile.apk',
      size: '18.4 MB',
      version: 'v1.5.2',
      requirements: 'Android 8.0 (Oreo) and above'
    }
  ];

  return (
    <div className="downloads-page">
      <Header onLoginClick={onLoginClick} />

      {/* Hero */}
      <section className="downloads-hero">
        <div className="downloads-hero-container">
          <h1>Download Applications</h1>
          <p>Get the native desktop setup and Android APK files for seamless integration.</p>
        </div>
      </section>

      {/* Main Downloads Layout */}
      <main className="downloads-main">
        <div className="downloads-grid">
          {downloadItems.map((item) => (
            <div key={item.title} className="download-card">
              <div className="card-header">
                {item.icon}
                <div className="card-meta">
                  <span className="card-platform">{item.platform}</span>
                  <h3>{item.title}</h3>
                </div>
              </div>

              <p className="card-description">{item.description}</p>

              <div className="card-info-specs">
                <div className="spec-item">
                  <span className="label">File Size</span>
                  <span className="value">{item.size}</span>
                </div>
                <div className="spec-item">
                  <span className="label">Version</span>
                  <span className="value">{item.version}</span>
                </div>
                <div className="spec-item">
                  <span className="label">System OS</span>
                  <span className="value">{item.requirements}</span>
                </div>
              </div>

              <div className="download-actions-stack">
                <a href={item.downloadUrl} download={item.fileName} className="download-btn-primary">
                  <Download size={18} />
                  <span>Download {item.fileName}</span>
                </a>
                
                {item.alternateDownloadUrl && (
                  <a href={item.alternateDownloadUrl} download={item.alternateFileName} className="download-btn-secondary">
                    <Download size={16} />
                    <span>Download (Alt: {item.alternateFileName})</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Installation Instructions */}
        <section className="install-guide-section">
          <h2>Quick Installation Guide</h2>
          
          <div className="guides-container">
            <div className="guide-card">
              <h4>Windows Desktop setup</h4>
              <ol>
                <li>Click the **Download Setup** button above to download the installer.</li>
                <li>Locate the downloaded `.exe` file in your downloads folder.</li>
                <li>Double-click the installer and follow the on-screen instructions.</li>
                <li>If prompted by Windows Defender, click *More Info* and *Run Anyway*.</li>
                <li>Launch EduCrop from the desktop shortcut created.</li>
              </ol>
            </div>

            <div className="guide-card">
              <h4>Android APK installation</h4>
              <ol>
                <li>Download the `.apk` file using your mobile phone browser.</li>
                <li>If prompted, open your device Settings and turn on *Install from Unknown Sources*.</li>
                <li>Open the downloaded `.apk` file and tap **Install**.</li>
                <li>Open the EduCrop app and scan the organization registration code.</li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Downloads;
