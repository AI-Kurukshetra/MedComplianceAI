-- =====================================================
-- ORGANIZATIONS
-- =====================================================

INSERT INTO organizations (id, slug, name)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','hospital-one','Hospital One'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','hospital-two','Hospital Two'),
('cccccccc-cccc-cccc-cccc-cccccccccccc','clinic-group','Clinic Group')
ON CONFLICT DO NOTHING;


-- =====================================================
-- USERS
-- =====================================================

INSERT INTO auth.users (id,email)
VALUES
('11111111-1111-1111-1111-111111111111','admin@hospital1.com'),
('22222222-2222-2222-2222-222222222222','manager@hospital1.com'),
('33333333-3333-3333-3333-333333333333','learner1@hospital1.com'),
('44444444-4444-4444-4444-444444444444','learner2@hospital1.com'),
('55555555-5555-5555-5555-555555555555','admin@hospital2.com'),
('66666666-6666-6666-6666-666666666666','learner@hospital2.com')
ON CONFLICT DO NOTHING;


-- =====================================================
-- UPDATE PROFILES (created automatically by trigger)
-- =====================================================

UPDATE profiles
SET organization_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
full_name='Admin One',
role='org_admin'
WHERE id='11111111-1111-1111-1111-111111111111';

UPDATE profiles
SET organization_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
full_name='Compliance Manager',
role='compliance_manager'
WHERE id='22222222-2222-2222-2222-222222222222';

UPDATE profiles
SET organization_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
full_name='Learner One',
role='learner'
WHERE id='33333333-3333-3333-3333-333333333333';

UPDATE profiles
SET organization_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
full_name='Learner Two',
role='learner'
WHERE id='44444444-4444-4444-4444-444444444444';

UPDATE profiles
SET organization_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
full_name='Hospital Two Admin',
role='org_admin'
WHERE id='55555555-5555-5555-5555-555555555555';

UPDATE profiles
SET organization_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
full_name='Hospital Two Learner',
role='learner'
WHERE id='66666666-6666-6666-6666-666666666666';


-- =====================================================
-- TRAINING MODULES
-- =====================================================

INSERT INTO training_modules
(id,organization_id,title,description,regulation,audience_role)
VALUES
('10000000-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','HIPAA Basics','Introduction to HIPAA','HIPAA','all'),
('10000000-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','HIPAA Security','Security rules training','HIPAA','all'),
('10000000-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','HITECH Overview','HITECH compliance','HITECH','all'),

('10000000-0000-0000-0000-000000000004','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','SOX Compliance','Financial compliance training','SOX','all'),
('10000000-0000-0000-0000-000000000005','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','FDA Regulations','Medical compliance','FDA','all'),

('10000000-0000-0000-0000-000000000006','cccccccc-cccc-cccc-cccc-cccccccccccc','Healthcare Security','Security in healthcare','HIPAA','all');


-- =====================================================
-- QUESTIONS (10 PER MODULE)
-- =====================================================

INSERT INTO questions
(id,module_id,organization_id,body,explanation,position)
SELECT
gen_random_uuid(),
m.id,
m.organization_id,
'Sample question '||g,
'Explanation for question '||g,
g
FROM training_modules m
CROSS JOIN generate_series(1,10) g;


-- =====================================================
-- OPTIONS (4 PER QUESTION)
-- =====================================================

INSERT INTO question_options
(id,question_id,body,is_correct,position)
SELECT
gen_random_uuid(),
q.id,
'Option '||o,
(o=1),
o
FROM questions q
CROSS JOIN generate_series(1,4) o;


-- =====================================================
-- MODULE ASSIGNMENTS
-- =====================================================

INSERT INTO module_assignments
(organization_id,user_id,module_id,status)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333','10000000-0000-0000-0000-000000000001','assigned'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333','10000000-0000-0000-0000-000000000002','in_progress'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','44444444-4444-4444-4444-444444444444','10000000-0000-0000-0000-000000000001','completed'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','66666666-6666-6666-6666-666666666666','10000000-0000-0000-0000-000000000004','assigned');


-- =====================================================
-- ASSESSMENT ATTEMPTS
-- =====================================================

INSERT INTO assessment_attempts
(organization_id,user_id,module_id,score,passed)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333','10000000-0000-0000-0000-000000000001',80,true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','44444444-4444-4444-4444-444444444444','10000000-0000-0000-0000-000000000001',92,true);


-- =====================================================
-- CERTIFICATIONS
-- =====================================================

INSERT INTO certifications
(organization_id,user_id,module_id,certificate_no,expires_at)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'44444444-4444-4444-4444-444444444444',
'10000000-0000-0000-0000-000000000001',
'CERT-HIPAA-0001',
now() + interval '1 year');


-- =====================================================
-- NOTIFICATIONS
-- =====================================================

INSERT INTO notifications
(organization_id,user_id,kind,title,message)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'33333333-3333-3333-3333-333333333333',
'assignment',
'New Training Assigned',
'You have been assigned HIPAA Basics'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'44444444-4444-4444-4444-444444444444',
'achievement',
'Certification Earned',
'You completed HIPAA Basics');


-- =====================================================
-- AUDIT LOGS
-- =====================================================

INSERT INTO audit_logs
(organization_id,actor_user_id,action,entity_type,entity_id)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'11111111-1111-1111-1111-111111111111',
'CREATE_MODULE',
'training_modules',
'10000000-0000-0000-0000-000000000001');