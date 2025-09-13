#!/bin/bash
# OpenEMR Sample Data and Test Records
# Realistic test data for development and demonstration

set -e

echo "Creating OpenEMR sample data and test records..."

mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    USE openemr;
    
    -- ========================================
    -- SAMPLE PATIENTS FOR TESTING
    -- ========================================
    
    -- Insert sample patients with realistic data
    INSERT IGNORE INTO patient_data (
        id, pid, title, fname, mname, lname, DOB, street, postal_code, city, state, country_code,
        phone_home, phone_cell, email, sex, race, ethnicity, status, pubpid, 
        regdate, facility_id, providerID, active
    ) VALUES
    (1, 1, 'Mr.', 'John', 'Michael', 'Smith', '1980-05-15', '123 Main Street', '12345', 'Anytown', 'NY', 'US',
     '555-123-4567', '555-987-6543', 'john.smith@email.com', 'Male', 'white', 'not_hispanic', 'married', 'PT001',
     '2025-01-15', 3, 1, 1),
     
    (2, 2, 'Ms.', 'Sarah', 'Elizabeth', 'Johnson', '1985-08-22', '456 Oak Avenue', '54321', 'Springfield', 'CA', 'US',
     '555-234-5678', '555-876-5432', 'sarah.johnson@email.com', 'Female', 'white', 'not_hispanic', 'single', 'PT002',
     '2025-01-20', 3, 1, 1),
     
    (3, 3, 'Dr.', 'Maria', 'Elena', 'Garcia', '1975-12-03', '789 Pine Road', '67890', 'Riverside', 'TX', 'US',
     '555-345-6789', '555-765-4321', 'maria.garcia@email.com', 'Female', 'other', 'hispanic', 'married', 'PT003',
     '2025-02-01', 3, 2, 1),
     
    (4, 4, 'Mr.', 'Robert', 'James', 'Brown', '1970-03-10', '321 Elm Street', '98765', 'Lakewood', 'FL', 'US',
     '555-456-7890', '555-654-3210', 'robert.brown@email.com', 'Male', 'black', 'not_hispanic', 'divorced', 'PT004',
     '2025-02-05', 3, 1, 1),
     
    (5, 5, 'Mrs.', 'Linda', 'Rose', 'Davis', '1965-11-28', '654 Maple Drive', '13579', 'Hillside', 'WA', 'US',
     '555-567-8901', '555-543-2109', 'linda.davis@email.com', 'Female', 'white', 'not_hispanic', 'widowed', 'PT005',
     '2025-02-10', 3, 2, 1);
    
    -- ========================================
    -- SAMPLE ENCOUNTERS AND VISITS
    -- ========================================
    
    -- Sample encounters for the patients
    INSERT IGNORE INTO form_encounter (
        id, date, reason, facility, facility_id, pid, encounter, 
        pc_catid, provider_id, class_code
    ) VALUES
    (1, '2025-09-01 09:00:00', 'Annual physical examination', 'WebQX Healthcare Facility', 3, 1, 1, 
     10, 1, 'AMB'),
    (2, '2025-09-01 10:30:00', 'Follow-up hypertension', 'WebQX Healthcare Facility', 3, 2, 2, 
     9, 1, 'AMB'),
    (3, '2025-09-02 14:00:00', 'Diabetes management', 'WebQX Healthcare Facility', 3, 3, 3, 
     9, 2, 'AMB'),
    (4, '2025-09-03 11:15:00', 'Back pain evaluation', 'WebQX Healthcare Facility', 3, 4, 4, 
     9, 1, 'AMB'),
    (5, '2025-09-04 15:30:00', 'WebQX Telehealth consultation', 'WebQX Healthcare Facility', 3, 5, 5, 
     12, 2, 'VR');
    
    -- ========================================
    -- SAMPLE VITAL SIGNS
    -- ========================================
    
    -- Vital signs for encounters
    INSERT IGNORE INTO form_vitals (
        id, date, pid, user, authorized, activity, 
        bps, bpd, weight, height, bmi, pulse, respiration, temperature, oxygen_saturation
    ) VALUES
    (1, '2025-09-01 09:15:00', 1, 'admin', 1, 1, 
     120, 80, 175.5, 70.0, 24.8, 72, 16, 98.6, 98.0),
    (2, '2025-09-01 10:45:00', 2, 'admin', 1, 1, 
     145, 95, 140.2, 64.0, 24.1, 88, 18, 99.2, 97.0),
    (3, '2025-09-02 14:15:00', 3, 'admin', 1, 1, 
     138, 82, 152.0, 62.0, 26.3, 76, 16, 98.4, 98.5),
    (4, '2025-09-03 11:30:00', 4, 'admin', 1, 1, 
     132, 88, 185.8, 72.0, 25.4, 70, 14, 98.9, 99.0),
    (5, '2025-09-04 15:45:00', 5, 'admin', 1, 1, 
     155, 98, 160.5, 66.0, 24.7, 82, 20, 99.1, 96.0);
    
    -- ========================================
    -- SAMPLE MEDICAL PROBLEMS AND CONDITIONS
    -- ========================================
    
    -- Patient medical problems
    INSERT IGNORE INTO lists (
        id, date, type, subtype, pid, begdate, title, diagnosis, activity, user, comments
    ) VALUES
    (1, '2025-09-01', 'medical_problem', '', 1, '2020-05-15', 'Hypertension', 'I10', 1, 'admin', 'Essential hypertension, well controlled'),
    (2, '2025-09-01', 'allergy', '', 1, '2015-03-20', 'Penicillin allergy', '', 1, 'admin', 'Mild rash reaction'),
    (3, '2025-09-02', 'medical_problem', '', 3, '2018-12-03', 'Type 2 Diabetes Mellitus', 'E11.9', 1, 'admin', 'Diet controlled, HbA1c 6.8%'),
    (4, '2025-09-02', 'allergy', '', 3, '2019-06-15', 'Sulfa drug allergy', '', 1, 'admin', 'Severe skin reaction'),
    (5, '2025-09-03', 'medical_problem', '', 4, '2025-08-20', 'Lower back pain', 'M54.5', 1, 'admin', 'Chronic lower back pain, work-related'),
    (6, '2025-09-04', 'medical_problem', '', 5, '2010-11-28', 'Osteoarthritis', 'M19.9', 1, 'admin', 'Bilateral knee osteoarthritis');
    
    -- ========================================
    -- SAMPLE PRESCRIPTIONS
    -- ========================================
    
    -- Active prescriptions for patients
    INSERT IGNORE INTO prescriptions (
        id, patient_id, provider_id, encounter, date_added, start_date, drug, drug_id,
        dosage, qty, refills, active, note
    ) VALUES
    (1, 1, 1, 1, '2025-09-01', '2025-09-01', 'Lisinopril 10mg', 3, 
     '10mg once daily', '30', 3, 1, 'For blood pressure control'),
    (2, 3, 2, 3, '2025-09-02', '2025-09-02', 'Metformin 500mg', 4, 
     '500mg twice daily with meals', '60', 5, 1, 'For diabetes management'),
    (3, 4, 1, 4, '2025-09-03', '2025-09-03', 'Ibuprofen 200mg', 2, 
     '200mg every 6 hours as needed', '20', 1, 1, 'For back pain relief'),
    (4, 5, 2, 5, '2025-09-04', '2025-09-04', 'Acetaminophen 325mg', 1, 
     '325mg every 4-6 hours as needed', '30', 2, 1, 'For arthritis pain management');
    
    -- ========================================
    -- SAMPLE IMMUNIZATIONS
    -- ========================================
    
    -- Patient immunization records
    INSERT IGNORE INTO immunizations (
        id, patient_id, administered_date, cvx_code, manufacturer, 
        lot_number, administered_by, note, amount_administered, route, administration_site
    ) VALUES
    (1, 1, '2025-09-01', '140', 'Pfizer', 'FL001A', 'Dr. Admin', 'Annual influenza vaccine', 0.5, 'Intramuscular', 'Left deltoid'),
    (2, 2, '2025-08-15', '140', 'Moderna', 'FL002B', 'Dr. Admin', 'Annual influenza vaccine', 0.5, 'Intramuscular', 'Right deltoid'),
    (3, 3, '2025-07-20', '121', 'GSK', 'ZOS001', 'Dr. Admin', 'Zoster vaccine (shingles)', 0.65, 'Intramuscular', 'Left deltoid'),
    (4, 4, '2025-06-10', '140', 'Sanofi', 'FL003C', 'Dr. Admin', 'Annual influenza vaccine', 0.5, 'Intramuscular', 'Right deltoid'),
    (5, 5, '2025-05-25', '133', 'Pfizer', 'PCV001', 'Dr. Admin', 'Pneumococcal vaccine', 0.5, 'Intramuscular', 'Left deltoid');
    
    -- ========================================
    -- SAMPLE APPOINTMENTS
    -- ========================================
    
    -- Future appointments
    INSERT IGNORE INTO openemr_postcalendar_events (
        pc_eid, pc_catid, pc_pid, pc_title, pc_eventDate, pc_endDate, pc_startTime, pc_endTime,
        pc_facility, pc_room, pc_apptstatus, pc_eventstatus
    ) VALUES
    (1, 9, '1', 'Follow-up visit - Hypertension', '2025-12-01', '2025-12-01', '09:00:00', '09:30:00',
     3, 'Room 101', '-', 1),
    (2, 10, '6', 'New patient consultation', '2025-10-15', '2025-10-15', '10:00:00', '11:00:00',
     3, 'Room 102', '-', 1),
    (3, 12, '3', 'WebQX Telehealth - Diabetes check', '2025-10-20', '2025-10-20', '14:00:00', '14:30:00',
     3, 'Virtual', '-', 1),
    (4, 9, '4', 'Physical therapy evaluation', '2025-10-25', '2025-10-25', '15:30:00', '16:00:00',
     3, 'Room 103', '-', 1),
    (5, 11, '5', 'Urgent care - Joint pain', '2025-09-15', '2025-09-15', '11:00:00', '11:30:00',
     3, 'Room 104', '-', 1);
    
    -- ========================================
    -- SAMPLE INSURANCE DATA
    -- ========================================
    
    -- Sample insurance companies
    INSERT IGNORE INTO insurance_companies (id, name, cms_id, ins_type_code) VALUES
    (1, 'Blue Cross Blue Shield', '12345', 1),
    (2, 'Aetna Health Insurance', '23456', 1),
    (3, 'UnitedHealthcare', '34567', 1),
    (4, 'Medicare', '99999', 2),
    (5, 'Medicaid', '88888', 3);
    
    -- Patient insurance information
    INSERT IGNORE INTO insurance_data (
        id, type, provider, plan_name, policy_number, group_number,
        subscriber_fname, subscriber_lname, subscriber_relationship, pid, date
    ) VALUES
    (1, 'primary', 1, 'Blue Choice PPO', 'BC123456789', 'GRP001', 
     'John', 'Smith', 'self', 1, '2025-01-01'),
    (2, 'primary', 2, 'Aetna Better Health', 'AET987654321', 'GRP002', 
     'Sarah', 'Johnson', 'self', 2, '2025-01-01'),
    (3, 'primary', 3, 'UnitedHealth Choice Plus', 'UHC456789123', 'GRP003', 
     'Maria', 'Garcia', 'self', 3, '2025-01-01'),
    (4, 'primary', 4, 'Medicare Part B', 'MED321654987', '', 
     'Robert', 'Brown', 'self', 4, '2025-01-01'),
    (5, 'primary', 5, 'Medicaid Standard', 'MCD789123456', '', 
     'Linda', 'Davis', 'self', 5, '2025-01-01');
    
    -- ========================================
    -- SAMPLE WEBQX TELEHEALTH SESSIONS
    -- ========================================
    
    -- WebQX telehealth session records
    INSERT IGNORE INTO webqx_telehealth_sessions (
        id, patient_id, provider_id, encounter_id, session_id, session_type,
        scheduled_datetime, started_datetime, ended_datetime, duration_minutes,
        session_status, connection_quality, clinical_notes, billing_code
    ) VALUES
    (1, 5, 2, 5, 'WEBQX-TH-001', 'video', 
     '2025-09-04 15:30:00', '2025-09-04 15:32:00', '2025-09-04 16:02:00', 30,
     'completed', 'excellent', 'Patient reports improved joint mobility with current treatment plan. Continue current medications.', '99421'),
    (2, 3, 2, NULL, 'WEBQX-TH-002', 'video', 
     '2025-10-20 14:00:00', NULL, NULL, NULL,
     'scheduled', NULL, NULL, '99421'),
    (3, 1, 1, NULL, 'WEBQX-TH-003', 'audio', 
     '2025-10-01 10:00:00', NULL, NULL, NULL,
     'scheduled', NULL, NULL, '99441');
    
    -- ========================================
    -- SAMPLE REMOTE MONITORING DATA
    -- ========================================
    
    -- Remote monitoring device data
    INSERT IGNORE INTO webqx_remote_monitoring (
        id, patient_id, device_type, device_id, measurement_type, measurement_value,
        measurement_unit, measurement_datetime, normal_range_min, normal_range_max, alert_level
    ) VALUES
    (1, 1, 'blood_pressure_monitor', 'BP-001-JS', 'systolic_bp', '125', 'mmHg', 
     '2025-09-13 08:00:00', 90, 140, 'normal'),
    (2, 1, 'blood_pressure_monitor', 'BP-001-JS', 'diastolic_bp', '82', 'mmHg', 
     '2025-09-13 08:00:00', 60, 90, 'normal'),
    (3, 3, 'glucose_meter', 'GLU-001-MG', 'blood_glucose', '145', 'mg/dL', 
     '2025-09-13 07:30:00', 70, 140, 'warning'),
    (4, 5, 'weight_scale', 'WS-001-LD', 'weight', '161.2', 'lbs', 
     '2025-09-13 06:45:00', 140, 180, 'normal'),
    (5, 4, 'pulse_oximeter', 'OX-001-RB', 'oxygen_saturation', '98', '%', 
     '2025-09-13 09:15:00', 95, 100, 'normal');
    
    -- ========================================
    -- SAMPLE AUDIT LOG ENTRIES
    -- ========================================
    
    -- Audit log entries for compliance tracking
    INSERT IGNORE INTO log (
        id, date, event, user, patient_id, success, comments
    ) VALUES
    (1, '2025-09-01 09:00:00', 'patient-record-view', 'admin', 1, 1, 'Viewed patient record during annual physical'),
    (2, '2025-09-01 09:15:00', 'vitals-entry', 'admin', 1, 1, 'Entered vital signs for encounter'),
    (3, '2025-09-02 14:00:00', 'prescription-create', 'admin', 3, 1, 'Created prescription for Metformin'),
    (4, '2025-09-04 15:30:00', 'telehealth-session', 'admin', 5, 1, 'Completed WebQX telehealth session'),
    (5, '2025-09-13 03:00:00', 'system-startup', 'system', NULL, 1, 'WebQX EMR system initialized with MariaDB');
    
EOSQL

echo "OpenEMR sample data created successfully!"
echo ""
echo "Sample data includes:"
echo "  ✅ 5 realistic test patients with demographics"
echo "  ✅ Multiple encounters and clinical visits"
echo "  ✅ Comprehensive vital signs records"
echo "  ✅ Medical problems and allergy information"
echo "  ✅ Active prescriptions and medications"
echo "  ✅ Immunization history and records"
echo "  ✅ Scheduled appointments (future)"
echo "  ✅ Insurance information and coverage"
echo "  ✅ WebQX telehealth session records"
echo "  ✅ Remote monitoring device data"
echo "  ✅ Audit trail and compliance logs"
echo ""
echo "Test Patients:"
echo "  📋 John Smith (PT001) - Hypertension, Penicillin allergy"
echo "  📋 Sarah Johnson (PT002) - Follow-up care"
echo "  📋 Maria Garcia (PT003) - Type 2 Diabetes"
echo "  📋 Robert Brown (PT004) - Lower back pain"
echo "  📋 Linda Davis (PT005) - Osteoarthritis, WebQX telehealth"