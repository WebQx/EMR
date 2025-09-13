# MariaDB Initialization Script for OpenEMR
# Creates database, user, and basic structure

# Create OpenEMR database and user
mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    -- Create OpenEMR database
    CREATE DATABASE IF NOT EXISTS openemr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    -- Create OpenEMR user
    CREATE USER IF NOT EXISTS 'openemr'@'%' IDENTIFIED BY 'openemr_password';
    GRANT ALL PRIVILEGES ON openemr.* TO 'openemr'@'%';
    
    -- Additional databases for WebQX integration
    CREATE DATABASE IF NOT EXISTS webqx_sessions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE IF NOT EXISTS webqx_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    -- Grant WebQX access
    GRANT ALL PRIVILEGES ON webqx_sessions.* TO 'openemr'@'%';
    GRANT ALL PRIVILEGES ON webqx_analytics.* TO 'openemr'@'%';
    
    -- Flush privileges
    FLUSH PRIVILEGES;
    
    USE openemr;
    
    -- Basic OpenEMR structure (minimal for initial setup)
    CREATE TABLE IF NOT EXISTS users (
        id int(11) NOT NULL AUTO_INCREMENT,
        username varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        authorized tinyint(4) DEFAULT 0,
        info longtext,
        source tinyint(4) DEFAULT NULL,
        fname varchar(255) DEFAULT NULL,
        mname varchar(255) DEFAULT NULL,
        lname varchar(255) DEFAULT NULL,
        federaltaxid varchar(255) DEFAULT NULL,
        federaldrugid varchar(255) DEFAULT NULL,
        upin varchar(255) DEFAULT NULL,
        facility varchar(255) DEFAULT NULL,
        facility_id int(11) NOT NULL DEFAULT 3,
        see_auth tinyint(4) NOT NULL DEFAULT 1,
        active tinyint(1) NOT NULL DEFAULT 1,
        npi varchar(15) DEFAULT NULL,
        title varchar(30) DEFAULT NULL,
        specialty varchar(255) DEFAULT NULL,
        billname varchar(255) DEFAULT NULL,
        email varchar(320) DEFAULT NULL,
        email_direct varchar(320) DEFAULT NULL,
        url varchar(255) DEFAULT NULL,
        assistant varchar(255) DEFAULT NULL,
        organization varchar(255) DEFAULT NULL,
        valedictory varchar(255) DEFAULT NULL,
        street varchar(60) DEFAULT NULL,
        streetb varchar(60) DEFAULT NULL,
        city varchar(30) DEFAULT NULL,
        state varchar(30) DEFAULT NULL,
        zip varchar(20) DEFAULT NULL,
        street2 varchar(60) DEFAULT NULL,
        streetb2 varchar(60) DEFAULT NULL,
        city2 varchar(30) DEFAULT NULL,
        state2 varchar(30) DEFAULT NULL,
        zip2 varchar(20) DEFAULT NULL,
        phone varchar(30) DEFAULT NULL,
        fax varchar(30) DEFAULT NULL,
        phonew1 varchar(30) DEFAULT NULL,
        phonew2 varchar(30) DEFAULT NULL,
        phonecell varchar(30) DEFAULT NULL,
        notes text,
        state_license_number2 varchar(25) DEFAULT NULL,
        abook_type varchar(31) NOT NULL DEFAULT 'external_provider',
        pwd_expiration_date date DEFAULT NULL,
        pwd_history1 longtext,
        pwd_history2 longtext,
        default_warehouse varchar(31) NOT NULL DEFAULT '',
        irnpool varchar(31) NOT NULL DEFAULT '',
        state_license_number varchar(25) DEFAULT NULL,
        newcrop_user_role varchar(30) DEFAULT NULL,
        cpoe tinyint(4) DEFAULT NULL,
        physician_type varchar(50) DEFAULT NULL,
        main_menu_role varchar(50) NOT NULL DEFAULT 'standard',
        patient_menu_role varchar(50) NOT NULL DEFAULT 'standard',
        calendar_ui tinyint(1) NOT NULL DEFAULT 1,
        taxonomy varchar(30) NOT NULL DEFAULT '207Q00000X',
        ssi_relayhealth varchar(64) DEFAULT NULL,
        google_signin_email varchar(320) DEFAULT NULL,
        erxprescribe_individual_enable tinyint(1) DEFAULT NULL,
        erxprescribe_account_id varchar(50) DEFAULT NULL,
        portal_user tinyint(1) NOT NULL DEFAULT 0,
        supervisor_id int(11) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Create default admin user
    INSERT IGNORE INTO users (
        username, password, authorized, fname, lname, 
        facility_id, active, title, specialty, main_menu_role
    ) VALUES (
        'admin', 
        '\$2y\$10\$L8gEOSBUayJO5mZ1XFVFDO.QKqNFZwfFqRX9VGOfAO89/VcZgLX.G', 
        1, 
        'Administrator', 
        'WebQX', 
        3, 
        1, 
        'Administrator', 
        'Administration', 
        'administrator'
    );
    
    -- Patient demographics table
    CREATE TABLE IF NOT EXISTS patient_data (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL DEFAULT '',
        language varchar(255) NOT NULL DEFAULT '',
        financial varchar(255) NOT NULL DEFAULT '',
        fname varchar(255) NOT NULL DEFAULT '',
        lname varchar(255) NOT NULL DEFAULT '',
        mname varchar(255) NOT NULL DEFAULT '',
        DOB date DEFAULT NULL,
        street varchar(255) NOT NULL DEFAULT '',
        postal_code varchar(255) NOT NULL DEFAULT '',
        city varchar(255) NOT NULL DEFAULT '',
        state varchar(255) NOT NULL DEFAULT '',
        country_code varchar(255) NOT NULL DEFAULT '',
        drivers_license varchar(255) NOT NULL DEFAULT '',
        ss varchar(255) NOT NULL DEFAULT '',
        occupation varchar(255) NOT NULL DEFAULT '',
        phone_home varchar(255) NOT NULL DEFAULT '',
        phone_biz varchar(255) NOT NULL DEFAULT '',
        phone_contact varchar(255) NOT NULL DEFAULT '',
        phone_cell varchar(255) NOT NULL DEFAULT '',
        pharmacy_id int(11) NOT NULL DEFAULT 0,
        status varchar(255) NOT NULL DEFAULT '',
        contact_relationship varchar(255) NOT NULL DEFAULT '',
        date datetime DEFAULT NULL,
        sex varchar(255) NOT NULL DEFAULT '',
        referrer varchar(255) NOT NULL DEFAULT '',
        referrerID varchar(255) NOT NULL DEFAULT '',
        providerID int(11) DEFAULT NULL,
        ref_providerID int(11) DEFAULT NULL,
        email varchar(320) DEFAULT NULL,
        email_direct varchar(320) DEFAULT NULL,
        ethnoracial varchar(255) NOT NULL DEFAULT '',
        race varchar(255) NOT NULL DEFAULT '',
        ethnicity varchar(255) NOT NULL DEFAULT '',
        religion varchar(40) NOT NULL DEFAULT '',
        interpretter varchar(255) NOT NULL DEFAULT '',
        migrantseasonal varchar(255) NOT NULL DEFAULT '',
        family_size varchar(255) NOT NULL DEFAULT '',
        monthly_income varchar(255) NOT NULL DEFAULT '',
        billing_note text,
        homeless varchar(255) NOT NULL DEFAULT '',
        financial_review datetime DEFAULT NULL,
        pubpid varchar(255) NOT NULL DEFAULT '',
        pid bigint(20) NOT NULL DEFAULT 0,
        genericname1 varchar(255) NOT NULL DEFAULT '',
        genericval1 varchar(255) NOT NULL DEFAULT '',
        genericname2 varchar(255) NOT NULL DEFAULT '',
        genericval2 varchar(255) NOT NULL DEFAULT '',
        hipaa_mail varchar(3) NOT NULL DEFAULT '',
        hipaa_voice varchar(3) NOT NULL DEFAULT '',
        hipaa_notice varchar(3) NOT NULL DEFAULT '',
        hipaa_message varchar(20) NOT NULL DEFAULT '',
        hipaa_allowsms varchar(3) NOT NULL DEFAULT 'NO',
        hipaa_allowemail varchar(3) NOT NULL DEFAULT 'NO',
        squad varchar(32) NOT NULL DEFAULT '',
        fitness int(11) NOT NULL DEFAULT 0,
        referral_source varchar(30) NOT NULL DEFAULT '',
        pricelevel varchar(255) NOT NULL DEFAULT 'standard',
        regdate date DEFAULT NULL,
        contrastart date DEFAULT NULL,
        completed_ad varchar(3) NOT NULL DEFAULT 'NO',
        ad_reviewed date DEFAULT NULL,
        vfc varchar(3) NOT NULL DEFAULT '',
        mothersname varchar(255) NOT NULL DEFAULT '',
        guardiansname text,
        allow_imm_reg_use varchar(255) NOT NULL DEFAULT '',
        allow_imm_info_share varchar(255) NOT NULL DEFAULT '',
        allow_health_info_ex varchar(255) NOT NULL DEFAULT '',
        allow_patient_portal varchar(31) NOT NULL DEFAULT '',
        deceased_date datetime DEFAULT NULL,
        deceased_reason varchar(255) NOT NULL DEFAULT '',
        soap_import_status tinyint(4) DEFAULT NULL,
        cmsportal_login varchar(60) NOT NULL DEFAULT '',
        care_team_provider varchar(100) DEFAULT NULL,
        care_team_facility varchar(100) DEFAULT NULL,
        imm_reg_status varchar(255) NOT NULL DEFAULT '',
        imm_reg_stat_effdate date DEFAULT NULL,
        publicity_code varchar(255) NOT NULL DEFAULT '',
        publ_code_eff_date date DEFAULT NULL,
        protect_indicator varchar(255) NOT NULL DEFAULT '',
        prot_indi_effdate date DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY pid (pid),
        KEY id (id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Facilities table
    CREATE TABLE IF NOT EXISTS facility (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) DEFAULT NULL,
        phone varchar(30) DEFAULT NULL,
        fax varchar(30) DEFAULT NULL,
        street varchar(255) DEFAULT NULL,
        city varchar(255) DEFAULT NULL,
        state varchar(50) DEFAULT NULL,
        postal_code varchar(11) DEFAULT NULL,
        country_code varchar(10) DEFAULT NULL,
        federal_ein varchar(15) DEFAULT NULL,
        website varchar(255) DEFAULT NULL,
        email varchar(320) DEFAULT NULL,
        service_location tinyint(1) NOT NULL DEFAULT 1,
        billing_location tinyint(1) NOT NULL DEFAULT 0,
        accepts_assignment tinyint(1) NOT NULL DEFAULT 0,
        pos_code tinyint(4) DEFAULT NULL,
        domain_identifier varchar(60) DEFAULT NULL,
        attn varchar(65) DEFAULT NULL,
        tax_id_type varchar(31) NOT NULL DEFAULT '',
        primary_business_entity tinyint(1) NOT NULL DEFAULT 0,
        facility_npi varchar(15) DEFAULT NULL,
        facility_taxonomy varchar(15) DEFAULT NULL,
        facility_code varchar(31) DEFAULT NULL,
        mail_street varchar(25) DEFAULT NULL,
        mail_street2 varchar(25) DEFAULT NULL,
        mail_city varchar(50) DEFAULT NULL,
        mail_state varchar(50) DEFAULT NULL,
        mail_zip varchar(10) DEFAULT NULL,
        oid varchar(255) NOT NULL DEFAULT '',
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Insert default facility
    INSERT IGNORE INTO facility (
        id, name, phone, street, city, state, postal_code,
        service_location, billing_location, facility_code
    ) VALUES (
        3, 'WebQX Healthcare Facility', '555-123-4567',
        '123 Healthcare Blvd', 'Medical City', 'CA', '90210',
        1, 1, 'WEBQX001'
    );
    
EOSQL