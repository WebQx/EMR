<?php
/**
 * WebQX™ Dashboard Module
 * Enhanced dashboard for WebQX EMR with modern analytics and insights
 */

use WebQX\EMR\WebQXConfig;

// Get configuration
$config = WebQXConfig::getConfig();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo WebQXConfig::BRAND_NAME; ?> - Dashboard</title>
    <?php echo WebQXConfig::enqueueWebQXStyles(); ?>
</head>
<body>
    <div class="webqx-container">
        <?php echo WebQXConfig::getBrandingHtml(); ?>
        
        <div class="webqx-dashboard">
            <div class="webqx-dashboard-header">
                <h1>📊 WebQX™ EMR Dashboard</h1>
                <p>Comprehensive healthcare management overview</p>
            </div>
            
            <div class="webqx-dashboard-grid">
                <!-- Patient Statistics -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>👥 Patient Overview</h3>
                        <span class="webqx-status-indicator webqx-status-active"></span>
                    </div>
                    <div class="widget-body">
                        <div class="stat-item">
                            <div class="stat-number">1,247</div>
                            <div class="stat-label">Active Patients</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">89</div>
                            <div class="stat-label">New This Month</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">156</div>
                            <div class="stat-label">Appointments Today</div>
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button class="webqx-btn webqx-btn-primary" onclick="window.open('?webqx_module=patients')">
                            View Patients
                        </button>
                    </div>
                </div>
                
                <!-- Appointments -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>📅 Appointments</h3>
                        <span class="webqx-status-indicator webqx-status-warning"></span>
                    </div>
                    <div class="widget-body">
                        <div class="appointment-list">
                            <div class="appointment-item">
                                <strong>09:00 AM</strong> - John Smith (Checkup)
                            </div>
                            <div class="appointment-item">
                                <strong>10:30 AM</strong> - Mary Johnson (Follow-up)
                            </div>
                            <div class="appointment-item">
                                <strong>02:00 PM</strong> - Robert Davis (Consultation)
                            </div>
                            <div class="appointment-item">
                                <strong>03:30 PM</strong> - Lisa Wilson (Vaccination)
                            </div>
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button class="webqx-btn webqx-btn-secondary" onclick="window.open('?webqx_module=calendar')">
                            View Calendar
                        </button>
                    </div>
                </div>
                
                <!-- Clinical Alerts -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>🚨 Clinical Alerts</h3>
                        <span class="webqx-status-indicator webqx-status-error"></span>
                    </div>
                    <div class="widget-body">
                        <div class="webqx-alert webqx-alert-error">
                            <strong>Critical:</strong> 3 patients require immediate attention
                        </div>
                        <div class="webqx-alert webqx-alert-warning">
                            <strong>Warning:</strong> 12 lab results pending review
                        </div>
                        <div class="webqx-alert webqx-alert-info">
                            <strong>Info:</strong> 25 prescription renewals due
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button class="webqx-btn webqx-btn-error" onclick="window.open('?webqx_module=alerts')">
                            View All Alerts
                        </button>
                    </div>
                </div>
                
                <!-- Revenue Analytics -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>💰 Revenue Analytics</h3>
                        <span class="webqx-status-indicator webqx-status-active"></span>
                    </div>
                    <div class="widget-body">
                        <div class="stat-item">
                            <div class="stat-number">$127,450</div>
                            <div class="stat-label">Monthly Revenue</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">$15,230</div>
                            <div class="stat-label">Outstanding Claims</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">94.2%</div>
                            <div class="stat-label">Collection Rate</div>
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button class="webqx-btn webqx-btn-success" onclick="window.open('?webqx_module=billing')">
                            View Billing
                        </button>
                    </div>
                </div>
                
                <!-- System Status -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>⚙️ System Status</h3>
                        <span class="webqx-status-indicator webqx-status-active"></span>
                    </div>
                    <div class="widget-body">
                        <div class="status-list">
                            <div class="status-item">
                                <span class="webqx-status-indicator webqx-status-active"></span>
                                EMR System - Online
                            </div>
                            <div class="status-item">
                                <span class="webqx-status-indicator webqx-status-active"></span>
                                Database - Connected
                            </div>
                            <div class="status-item">
                                <span class="webqx-status-indicator webqx-status-active"></span>
                                Backup - Current
                            </div>
                            <div class="status-item">
                                <span class="webqx-status-indicator webqx-status-warning"></span>
                                Security Scan - Due
                            </div>
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button class="webqx-btn webqx-btn-secondary" onclick="window.open('?webqx_module=admin')">
                            System Admin
                        </button>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="webqx-dashboard-widget">
                    <div class="widget-header">
                        <h3>⚡ Quick Actions</h3>
                    </div>
                    <div class="widget-body">
                        <div class="action-grid">
                            <button class="webqx-btn webqx-btn-primary" onclick="window.open('?webqx_module=patients&action=new')">
                                ➕ New Patient
                            </button>
                            <button class="webqx-btn webqx-btn-primary" onclick="window.open('?webqx_module=appointments&action=new')">
                                📅 Schedule Appointment
                            </button>
                            <button class="webqx-btn webqx-btn-primary" onclick="window.open('?webqx_module=prescriptions&action=new')">
                                💊 New Prescription
                            </button>
                            <button class="webqx-btn webqx-btn-primary" onclick="window.open('?webqx_module=lab&action=order')">
                                🧪 Order Lab Test
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .webqx-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .webqx-dashboard-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .webqx-dashboard-header h1 {
            color: var(--webqx-primary-dark);
            margin-bottom: 10px;
        }
        
        .webqx-dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .widget-header h3 {
            color: var(--webqx-primary-dark);
            margin: 0;
        }
        
        .widget-body {
            margin-bottom: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            border: 1px solid var(--webqx-gray-200);
            border-radius: var(--webqx-radius-md);
            margin-bottom: 10px;
        }
        
        .stat-number {
            font-size: var(--webqx-font-size-2xl);
            font-weight: bold;
            color: var(--webqx-primary);
        }
        
        .stat-label {
            color: var(--webqx-gray-600);
            font-size: var(--webqx-font-size-sm);
        }
        
        .appointment-item, .status-item {
            padding: 10px;
            border-bottom: 1px solid var(--webqx-gray-200);
            display: flex;
            align-items: center;
        }
        
        .action-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .widget-actions {
            text-align: center;
        }
    </style>
</body>
</html>
