<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Certificate of Completion</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; text-align: center; color: #333; margin: 0; padding: 0; }
        .certificate-container { border: 10px solid #4F46E5; padding: 50px; margin: 20px; box-sizing: border-box; position: relative; height: 90vh; display: table; width: 95%; }
        .certificate-content { display: table-cell; vertical-align: middle; }
        .title { font-size: 50px; font-weight: bold; color: #4F46E5; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 2px; }
        .subtitle { font-size: 24px; color: #666; margin-bottom: 20px; }
        .student-name { font-size: 40px; font-weight: bold; color: #111; margin: 20px 0; text-decoration: underline; text-decoration-color: #4F46E5; }
        .description { font-size: 20px; color: #555; margin-bottom: 20px; line-height: 1.5; }
        .course-name { font-size: 30px; font-weight: bold; color: #333; margin: 20px 0; }
        .footer { margin-top: 50px; }
        .date { float: left; font-size: 18px; border-top: 1px solid #999; padding-top: 5px; width: 200px; text-align: center; }
        .signature { float: right; font-size: 18px; border-top: 1px solid #999; padding-top: 5px; width: 200px; text-align: center; }
        .cert-id { position: absolute; bottom: 20px; right: 20px; font-size: 12px; color: #999; font-family: monospace; }
        .seal { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; background-color: #4F46E5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; text-align: center; line-height: 1.2; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .seal-inner { border: 2px dashed white; border-radius: 50%; width: 80px; height: 80px; margin: 10px auto; padding-top: 25px; box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-content">
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is proudly presented to</div>
            
            <div class="student-name">{{ $studentName }}</div>
            
            <div class="description">
                For successfully completing the comprehensive program and demonstrating mastery in
            </div>
            
            <div class="course-name">{{ $courseName }}</div>
            
            <div class="footer">
                <div class="date">
                    <div>{{ $date }}</div>
                    <div>Date</div>
                </div>
                
                <div class="signature">
                    <div>{{ $teacherName }}</div>
                    <div>Instructor</div>
                </div>
                
                <div style="clear: both;"></div>
            </div>
            
            <div class="seal">
                <div class="seal-inner">EDUTech<br>Verified</div>
            </div>
            
            <div class="cert-id">Certificate ID: {{ $certificateId }}</div>
        </div>
    </div>
</body>
</html>
