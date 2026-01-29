-- V62: Seed Compliance Frameworks and Policy Templates

-- Insert Compliance Frameworks
INSERT INTO compliance_frameworks (id, code, name, name_ar, description, description_ar, version, issuing_body, certification_validity_months) VALUES
    (gen_random_uuid(), 'ISO_27001', 'ISO/IEC 27001:2022', 'آيزو/آي إي سي 27001:2022',
     'Information security management systems - Requirements. International standard for establishing, implementing, maintaining and continually improving an information security management system.',
     'أنظمة إدارة أمن المعلومات - المتطلبات. معيار دولي لإنشاء وتنفيذ وصيانة وتحسين نظام إدارة أمن المعلومات بشكل مستمر.',
     '2022', 'ISO/IEC', 36),

    (gen_random_uuid(), 'SOC_2', 'SOC 2 Type II', 'سوك 2 النوع الثاني',
     'Service Organization Control 2 - Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.',
     'تقرير ضوابط منظمة الخدمة 2 - معايير خدمات الثقة للأمان والتوافر وسلامة المعالجة والسرية والخصوصية.',
     '2017', 'AICPA', 12),

    (gen_random_uuid(), 'PCI_DSS', 'PCI DSS v4.0', 'معيار أمن بيانات صناعة بطاقات الدفع',
     'Payment Card Industry Data Security Standard - Requirements for organizations that handle credit card data.',
     'معيار أمن بيانات صناعة بطاقات الدفع - متطلبات للمؤسسات التي تتعامل مع بيانات بطاقات الائتمان.',
     '4.0', 'PCI SSC', 12),

    (gen_random_uuid(), 'PDPL', 'Saudi PDPL', 'نظام حماية البيانات الشخصية',
     'Saudi Personal Data Protection Law - Comprehensive privacy law protecting personal data of individuals in Saudi Arabia.',
     'نظام حماية البيانات الشخصية - قانون شامل لحماية الخصوصية يحمي البيانات الشخصية للأفراد في المملكة العربية السعودية.',
     '2021', 'SDAIA', NULL);

-- Insert ISO 27001 Key Controls (Annex A)
INSERT INTO compliance_requirements (framework_id, control_number, title, title_ar, description, category, is_mandatory, evidence_required)
SELECT f.id, r.control_number, r.title, r.title_ar, r.description, r.category, r.is_mandatory, r.evidence_required
FROM compliance_frameworks f, (VALUES
    ('A.5.1', 'Information security policies', 'سياسات أمن المعلومات', 'Management direction for information security', 'Organizational Controls', true, true),
    ('A.5.2', 'Information security roles and responsibilities', 'أدوار ومسؤوليات أمن المعلومات', 'Define and allocate information security responsibilities', 'Organizational Controls', true, true),
    ('A.5.3', 'Segregation of duties', 'الفصل بين الواجبات', 'Conflicting duties and areas of responsibility shall be segregated', 'Organizational Controls', true, true),
    ('A.5.4', 'Management responsibilities', 'مسؤوليات الإدارة', 'Management shall require all personnel to apply information security', 'Organizational Controls', true, true),
    ('A.5.7', 'Threat intelligence', 'استخبارات التهديدات', 'Information relating to information security threats shall be collected and analyzed', 'Organizational Controls', true, true),
    ('A.5.15', 'Access control', 'التحكم في الوصول', 'Rules to control physical and logical access to information', 'Organizational Controls', true, true),
    ('A.5.17', 'Authentication information', 'معلومات المصادقة', 'Allocation of authentication information shall be controlled', 'Organizational Controls', true, true),
    ('A.5.22', 'Monitoring of privileged access rights', 'مراقبة حقوق الوصول المميزة', 'The allocation and use of privileged access rights shall be restricted and managed', 'Organizational Controls', true, true),
    ('A.5.24', 'Information security incident planning', 'تخطيط حوادث أمن المعلومات', 'Procedures for planning and preparation for incident response', 'Organizational Controls', true, true),
    ('A.5.28', 'Collection of evidence', 'جمع الأدلة', 'Procedures for the identification, collection, acquisition and preservation of evidence', 'Organizational Controls', true, true),
    ('A.5.29', 'Information security during disruption', 'أمن المعلومات أثناء الاضطراب', 'ICT continuity requirements during adverse situations', 'Organizational Controls', true, true),
    ('A.5.30', 'ICT readiness for business continuity', 'جاهزية تكنولوجيا المعلومات لاستمرارية الأعمال', 'ICT readiness shall be planned, implemented and tested', 'Organizational Controls', true, true),
    ('A.5.31', 'Legal requirements', 'المتطلبات القانونية', 'Identify, document and keep up to date legal requirements', 'Organizational Controls', true, true),
    ('A.5.34', 'Privacy and protection of PII', 'الخصوصية وحماية المعلومات الشخصية', 'Privacy and protection of PII shall be ensured as required', 'Organizational Controls', true, true),
    ('A.6.1', 'Screening', 'الفحص', 'Background verification checks on candidates for employment', 'People Controls', true, true),
    ('A.6.3', 'Information security awareness', 'التوعية بأمن المعلومات', 'Personnel shall receive appropriate awareness education and training', 'People Controls', true, true),
    ('A.7.1', 'Physical security perimeters', 'محيطات الأمن المادي', 'Security perimeters shall be defined and used to protect areas', 'Physical Controls', true, true),
    ('A.7.4', 'Physical security monitoring', 'مراقبة الأمن المادي', 'Premises shall be continuously monitored for unauthorized physical access', 'Physical Controls', true, true),
    ('A.8.1', 'User endpoint devices', 'أجهزة نقطة النهاية للمستخدم', 'Information stored on, processed by or accessible via user endpoint devices', 'Technological Controls', true, true),
    ('A.8.2', 'Privileged access rights', 'حقوق الوصول المميزة', 'The allocation and use of privileged access rights shall be restricted', 'Technological Controls', true, true),
    ('A.8.3', 'Information access restriction', 'تقييد الوصول إلى المعلومات', 'Access to information and system functions shall be restricted', 'Technological Controls', true, true),
    ('A.8.5', 'Secure authentication', 'المصادقة الآمنة', 'Secure authentication technologies and procedures shall be implemented', 'Technological Controls', true, true),
    ('A.8.9', 'Configuration management', 'إدارة التكوين', 'Configurations including security configurations shall be managed', 'Technological Controls', true, true),
    ('A.8.12', 'Data leakage prevention', 'منع تسرب البيانات', 'Data leakage prevention measures shall be applied', 'Technological Controls', true, true),
    ('A.8.15', 'Logging', 'التسجيل', 'Logs shall record activities, exceptions, faults and other relevant events', 'Technological Controls', true, true),
    ('A.8.16', 'Monitoring activities', 'أنشطة المراقبة', 'Networks, systems and applications shall be monitored', 'Technological Controls', true, true),
    ('A.8.24', 'Use of cryptography', 'استخدام التشفير', 'Rules for the effective use of cryptography shall be defined', 'Technological Controls', true, true),
    ('A.8.25', 'Secure development life cycle', 'دورة حياة التطوير الآمن', 'Rules for the secure development of software shall be established', 'Technological Controls', true, true),
    ('A.8.28', 'Secure coding', 'الترميز الآمن', 'Secure coding principles shall be applied to software development', 'Technological Controls', true, true),
    ('A.8.31', 'Separation of development environments', 'فصل بيئات التطوير', 'Development, testing and production environments shall be separated', 'Technological Controls', true, true)
) AS r(control_number, title, title_ar, description, category, is_mandatory, evidence_required)
WHERE f.code = 'ISO_27001';

-- Insert SOC 2 Trust Services Criteria
INSERT INTO compliance_requirements (framework_id, control_number, title, title_ar, description, category, is_mandatory, evidence_required)
SELECT f.id, r.control_number, r.title, r.title_ar, r.description, r.category, r.is_mandatory, r.evidence_required
FROM compliance_frameworks f, (VALUES
    ('CC1.1', 'COSO Principle 1', 'مبدأ كوسو 1', 'The entity demonstrates a commitment to integrity and ethical values', 'Common Criteria', true, true),
    ('CC1.2', 'COSO Principle 2', 'مبدأ كوسو 2', 'The board of directors demonstrates independence and oversight', 'Common Criteria', true, true),
    ('CC2.1', 'COSO Principle 13', 'مبدأ كوسو 13', 'The entity obtains or generates relevant, quality information', 'Common Criteria', true, true),
    ('CC2.2', 'COSO Principle 14', 'مبدأ كوسو 14', 'The entity internally communicates information', 'Common Criteria', true, true),
    ('CC3.1', 'COSO Principle 6', 'مبدأ كوسو 6', 'The entity specifies objectives with sufficient clarity', 'Common Criteria', true, true),
    ('CC3.2', 'COSO Principle 7', 'مبدأ كوسو 7', 'The entity identifies risks to the achievement of its objectives', 'Common Criteria', true, true),
    ('CC3.3', 'COSO Principle 8', 'مبدأ كوسو 8', 'The entity considers the potential for fraud in assessing risks', 'Common Criteria', true, true),
    ('CC4.1', 'COSO Principle 16', 'مبدأ كوسو 16', 'The entity selects and develops ongoing and/or separate evaluations', 'Common Criteria', true, true),
    ('CC5.1', 'COSO Principle 10', 'مبدأ كوسو 10', 'The entity selects and develops control activities', 'Common Criteria', true, true),
    ('CC5.2', 'COSO Principle 11', 'مبدأ كوسو 11', 'The entity also selects technology general controls', 'Common Criteria', true, true),
    ('CC5.3', 'COSO Principle 12', 'مبدأ كوسو 12', 'The entity deploys control activities through policies and procedures', 'Common Criteria', true, true),
    ('CC6.1', 'Logical and Physical Access Controls', 'ضوابط الوصول المنطقي والمادي', 'The entity implements logical access security software', 'Security', true, true),
    ('CC6.2', 'User Authentication', 'مصادقة المستخدم', 'Prior to issuing system credentials, the entity registers and authorizes new users', 'Security', true, true),
    ('CC6.3', 'User Access Removal', 'إزالة وصول المستخدم', 'The entity removes system access when no longer required', 'Security', true, true),
    ('CC6.6', 'System Boundaries', 'حدود النظام', 'The entity restricts the ability to download software', 'Security', true, true),
    ('CC6.7', 'Data Encryption', 'تشفير البيانات', 'The entity protects data in transit and at rest', 'Security', true, true),
    ('CC7.1', 'Infrastructure and Software', 'البنية التحتية والبرمجيات', 'To meet its objectives, the entity uses detection and monitoring procedures', 'Security', true, true),
    ('CC7.2', 'Security Incident Detection', 'كشف الحوادث الأمنية', 'The entity monitors system components', 'Security', true, true),
    ('CC7.3', 'Security Incident Response', 'الاستجابة للحوادث الأمنية', 'The entity evaluates security events', 'Security', true, true),
    ('CC7.4', 'Business Continuity', 'استمرارية الأعمال', 'The entity has implemented business continuity procedures', 'Security', true, true),
    ('CC8.1', 'Change Management', 'إدارة التغيير', 'The entity authorizes, designs, and develops changes', 'Security', true, true),
    ('CC9.1', 'Vendor Management', 'إدارة البائعين', 'The entity identifies and assesses risks from vendors', 'Security', true, true),
    ('A1.1', 'Availability', 'التوافر', 'The entity maintains, monitors capacity and availability', 'Availability', true, true),
    ('A1.2', 'Recovery', 'الاسترداد', 'The entity tests recovery plan procedures', 'Availability', true, true),
    ('PI1.1', 'Processing Integrity', 'سلامة المعالجة', 'The entity obtains data from accurate and complete sources', 'Processing Integrity', true, true),
    ('C1.1', 'Confidentiality', 'السرية', 'The entity identifies and maintains confidential information', 'Confidentiality', true, true),
    ('P1.1', 'Privacy Notice', 'إشعار الخصوصية', 'The entity provides notice to data subjects about its privacy practices', 'Privacy', true, true),
    ('P2.1', 'Privacy Choice and Consent', 'الاختيار والموافقة', 'The entity communicates choices available to data subjects', 'Privacy', true, true),
    ('P3.1', 'Privacy Collection', 'جمع البيانات', 'The entity collects personal information only for purposes identified', 'Privacy', true, true),
    ('P4.1', 'Privacy Use and Retention', 'الاستخدام والاحتفاظ', 'The entity limits the use and retention of personal information', 'Privacy', true, true)
) AS r(control_number, title, title_ar, description, category, is_mandatory, evidence_required)
WHERE f.code = 'SOC_2';

-- Insert PCI DSS Requirements
INSERT INTO compliance_requirements (framework_id, control_number, title, title_ar, description, category, is_mandatory, evidence_required)
SELECT f.id, r.control_number, r.title, r.title_ar, r.description, r.category, r.is_mandatory, r.evidence_required
FROM compliance_frameworks f, (VALUES
    ('1.1', 'Network Security Controls', 'ضوابط أمان الشبكة', 'Install and maintain network security controls', 'Build and Maintain a Secure Network', true, true),
    ('1.2', 'Firewall Configuration', 'تكوين جدار الحماية', 'Apply secure configurations to all system components', 'Build and Maintain a Secure Network', true, true),
    ('2.1', 'Vendor Defaults', 'الإعدادات الافتراضية', 'Do not use vendor-supplied defaults for passwords', 'Build and Maintain a Secure Network', true, true),
    ('3.1', 'Protect Stored Data', 'حماية البيانات المخزنة', 'Keep cardholder data storage to a minimum', 'Protect Account Data', true, true),
    ('3.2', 'SAD Storage', 'تخزين بيانات المصادقة', 'Do not store sensitive authentication data after authorization', 'Protect Account Data', true, true),
    ('3.3', 'Display PAN', 'عرض رقم البطاقة', 'Mask PAN when displayed', 'Protect Account Data', true, true),
    ('3.4', 'Render PAN Unreadable', 'جعل رقم البطاقة غير قابل للقراءة', 'Render PAN unreadable anywhere it is stored', 'Protect Account Data', true, true),
    ('3.5', 'Protect Cryptographic Keys', 'حماية مفاتيح التشفير', 'Protect keys used to secure stored account data', 'Protect Account Data', true, true),
    ('4.1', 'Strong Cryptography', 'التشفير القوي', 'Use strong cryptography during transmission over open networks', 'Protect Account Data', true, true),
    ('5.1', 'Anti-Malware', 'مكافحة البرمجيات الخبيثة', 'Deploy anti-malware software on all systems', 'Maintain a Vulnerability Management Program', true, true),
    ('5.2', 'Security Patches', 'تصحيحات الأمان', 'Install security patches in a timely manner', 'Maintain a Vulnerability Management Program', true, true),
    ('6.1', 'Secure Development', 'التطوير الآمن', 'Develop and maintain secure systems and software', 'Maintain a Vulnerability Management Program', true, true),
    ('7.1', 'Restrict Access', 'تقييد الوصول', 'Restrict access to system components based on need to know', 'Implement Strong Access Control Measures', true, true),
    ('7.2', 'Least Privilege', 'أقل الامتيازات', 'Establish an access control system for system components', 'Implement Strong Access Control Measures', true, true),
    ('8.1', 'User Identification', 'تحديد هوية المستخدم', 'Assign a unique ID to each person with computer access', 'Implement Strong Access Control Measures', true, true),
    ('8.2', 'User Authentication', 'مصادقة المستخدم', 'Employ at least one factor to authenticate users', 'Implement Strong Access Control Measures', true, true),
    ('8.3', 'Multi-Factor Authentication', 'المصادقة متعددة العوامل', 'Use multi-factor authentication for remote network access', 'Implement Strong Access Control Measures', true, true),
    ('9.1', 'Physical Access', 'الوصول المادي', 'Restrict physical access to cardholder data', 'Implement Strong Access Control Measures', true, true),
    ('10.1', 'Audit Trails', 'سجلات التدقيق', 'Implement audit trails to link all access to individual users', 'Regularly Monitor and Test Networks', true, true),
    ('10.2', 'Logging', 'التسجيل', 'Implement automated audit trails', 'Regularly Monitor and Test Networks', true, true),
    ('10.3', 'Log Entries', 'إدخالات السجل', 'Record specific audit trail entries', 'Regularly Monitor and Test Networks', true, true),
    ('10.4', 'Time Synchronization', 'مزامنة الوقت', 'Using time-synchronization technology', 'Regularly Monitor and Test Networks', true, true),
    ('10.5', 'Secure Audit Trails', 'سجلات تدقيق آمنة', 'Secure audit trails so they cannot be altered', 'Regularly Monitor and Test Networks', true, true),
    ('11.1', 'Security Testing', 'اختبار الأمان', 'Regularly test security systems and processes', 'Regularly Monitor and Test Networks', true, true),
    ('11.2', 'Vulnerability Scans', 'فحص الثغرات', 'Run internal and external vulnerability scans', 'Regularly Monitor and Test Networks', true, true),
    ('11.3', 'Penetration Testing', 'اختبار الاختراق', 'Perform internal and external penetration testing', 'Regularly Monitor and Test Networks', true, true),
    ('12.1', 'Information Security Policy', 'سياسة أمن المعلومات', 'Establish, publish, maintain, and disseminate a security policy', 'Maintain an Information Security Policy', true, true),
    ('12.3', 'Risk Assessment', 'تقييم المخاطر', 'Perform risk assessments at least annually', 'Maintain an Information Security Policy', true, true),
    ('12.6', 'Security Awareness', 'الوعي الأمني', 'Implement a security awareness program', 'Maintain an Information Security Policy', true, true),
    ('12.10', 'Incident Response', 'الاستجابة للحوادث', 'Implement an incident response plan', 'Maintain an Information Security Policy', true, true)
) AS r(control_number, title, title_ar, description, category, is_mandatory, evidence_required)
WHERE f.code = 'PCI_DSS';

-- Insert PDPL Requirements
INSERT INTO compliance_requirements (framework_id, control_number, title, title_ar, description, category, is_mandatory, evidence_required)
SELECT f.id, r.control_number, r.title, r.title_ar, r.description, r.category, r.is_mandatory, r.evidence_required
FROM compliance_frameworks f, (VALUES
    ('Art.5', 'Lawfulness of Processing', 'مشروعية المعالجة', 'Personal data shall be collected and processed lawfully', 'Data Processing Principles', true, true),
    ('Art.6', 'Consent Requirements', 'متطلبات الموافقة', 'Processing requires consent unless exception applies', 'Consent', true, true),
    ('Art.7', 'Processing Register', 'سجل المعالجة', 'Maintain a register of data processing activities', 'Documentation', true, true),
    ('Art.8', 'Purpose Limitation', 'تحديد الغرض', 'Data shall only be collected for specified, explicit purposes', 'Data Processing Principles', true, true),
    ('Art.9', 'Data Minimization', 'تقليل البيانات', 'Data collected shall be adequate, relevant and limited', 'Data Processing Principles', true, true),
    ('Art.10', 'Accuracy', 'الدقة', 'Personal data shall be accurate and kept up to date', 'Data Processing Principles', true, true),
    ('Art.11', 'Storage Limitation', 'تحديد التخزين', 'Data shall not be kept longer than necessary', 'Data Retention', true, true),
    ('Art.14', 'Privacy Notice', 'إشعار الخصوصية', 'Inform data subjects about data processing', 'Transparency', true, true),
    ('Art.15', 'Right of Access', 'حق الوصول', 'Data subjects have the right to access their personal data', 'Data Subject Rights', true, true),
    ('Art.16', 'Right to Rectification', 'حق التصحيح', 'Data subjects can request correction of inaccurate data', 'Data Subject Rights', true, true),
    ('Art.17', 'Right to Erasure', 'حق المحو', 'Data subjects can request deletion of their personal data', 'Data Subject Rights', true, true),
    ('Art.18', 'Right to Portability', 'حق قابلية النقل', 'Data subjects can obtain their data in a portable format', 'Data Subject Rights', true, true),
    ('Art.19', 'Right to Object', 'حق الاعتراض', 'Data subjects can object to processing', 'Data Subject Rights', true, true),
    ('Art.20', 'Right to Restrict', 'حق التقييد', 'Data subjects can request restriction of processing', 'Data Subject Rights', true, true),
    ('Art.21', 'Automated Decision-Making', 'اتخاذ القرار الآلي', 'Rules for automated individual decision-making', 'Data Subject Rights', true, true),
    ('Art.22', 'Sensitive Data', 'البيانات الحساسة', 'Special rules for processing sensitive personal data', 'Special Categories', true, true),
    ('Art.23', 'Minors Data', 'بيانات القاصرين', 'Special protection for children''s personal data', 'Special Categories', true, true),
    ('Art.24', 'Cross-border Transfer', 'النقل عبر الحدود', 'Requirements for transferring data outside Saudi Arabia', 'International Transfers', true, true),
    ('Art.26', 'Response Deadline', 'الموعد النهائي للرد', 'Respond to data subject requests within 30 days', 'Data Subject Rights', true, true),
    ('Art.27', 'Data Protection Officer', 'مسؤول حماية البيانات', 'Appoint a Data Protection Officer when required', 'Governance', true, true),
    ('Art.28', 'Security Measures', 'التدابير الأمنية', 'Implement appropriate technical and organizational measures', 'Security', true, true),
    ('Art.29', 'Data Breach Notification', 'إخطار خرق البيانات', 'Notify SDAIA of breaches within 72 hours', 'Breach Management', true, true),
    ('Art.30', 'Individual Breach Notification', 'إخطار الأفراد بالخرق', 'Notify affected individuals of high-risk breaches', 'Breach Management', true, true),
    ('Art.31', 'Privacy Impact Assessment', 'تقييم تأثير الخصوصية', 'Conduct privacy impact assessments for high-risk processing', 'Risk Assessment', true, true),
    ('Art.32', 'Processor Requirements', 'متطلبات المعالج', 'Requirements for engaging data processors', 'Third Parties', true, true),
    ('Art.36', 'Violations and Penalties', 'المخالفات والعقوبات', 'Understanding penalties for non-compliance', 'Compliance', true, true)
) AS r(control_number, title, title_ar, description, category, is_mandatory, evidence_required)
WHERE f.code = 'PDPL';
