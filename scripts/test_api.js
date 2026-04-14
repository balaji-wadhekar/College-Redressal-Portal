const test = async () => {
    try {
        console.log('1. Testing Login with lowercase enrollment (should be case-insensitive)');
        let loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollment: 'verify001', password: 'hashedpassword123' })
        });
        
        let cookie = loginRes.headers.get('set-cookie');
        let data = await loginRes.json();
        
        if (!data.success) {
            console.error('Login failed:', data);
            process.exit(1);
        }
        console.log('✅ Login successful:', data.user.enrollment);

        console.log('\n2. Testing Complaint Submission (trackingID generation)');
        const formData = new FormData();
        formData.append('title', 'API Test Grievance');
        formData.append('category', 'General Grievance');
        formData.append('description', 'Testing the tracking ID generation');
        formData.append('incidentDate', new Date().toISOString());
        formData.append('studentName', 'Test Name');
        formData.append('studentPhone', '1234567890');
        formData.append('studentEnrollment', 'VERIFY001');
        formData.append('studentDept', 'Computer Engineering');
        
        let complaintRes = await fetch('http://localhost:3000/api/complaints', {
            method: 'POST',
            headers: { 'cookie': cookie || '' },
            body: formData
        });
        
        let complaintData = await complaintRes.json();
        if(!complaintData.success) {
            console.error('Complaint submission failed:', complaintData);
            process.exit(1);
        }
        
        console.log('✅ Complaint submitted successfully');
        console.log('✅ Generated Tracking ID:', complaintData.complaint.trackingID);
        
        if (!complaintData.complaint.trackingID) {
            console.error('❌ Tracking ID is missing!');
            process.exit(1);
        }

        console.log('\n🎉 ALL LIVE API TESTS PASSED!');
        process.exit(0);

    } catch (e) {
        console.error('Test failed with exception:', e);
        process.exit(1);
    }
};
test();
