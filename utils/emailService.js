const nodemailer = require('nodemailer');

// Configure your SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// === AGGRESSIVE LOGGING: Check if credentials are correct at server launch ===
transporter.verify(function (error, success) {
  if (error) {
    console.log('Transporter Error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});
// ============================================================================

/**
 * Sends an official status update email to the student
 */
const sendStatusUpdateEmail = async (studentEmail, studentName, trackingID, newStatus) => {
  // === LOG ATTEMPT ===
  console.log(`Attempting to send email to: ${studentEmail} for status ${newStatus}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email Mock] Would send ${newStatus} update to ${studentEmail} (${studentName}) for ${trackingID}`);
    return;
  }

  try {
    const htmlMessage = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: auto; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">Grievance Redressal Cell</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">This is an official notification regarding the grievance you submitted to the administration.</p>

            <div style="background-color: #f8fafc; padding: 20px; border-left: 5px solid #1e3a8a; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase;">Tracking Reference Number</p>
                <p style="margin: 5px 0 15px 0; font-size: 18px; color: #111827; font-weight: bold;">${trackingID}</p>
                
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase;">Current Status</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; color: #1e3a8a; font-weight: bold; text-transform: uppercase;">${newStatus}</p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">The administration has updated your file. Please access the student portal to view detailed remarks, expected resolutions, or further instructions provided by the committee.</p>
        </div>
    </div>
    `;

    const mailOptions = {
      from: `"Grievance Cell" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Official Update: Grievance Status - ${trackingID}`,
      html: htmlMessage
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Status update email successfully sent to ${studentEmail}`);

  } catch (error) {
    console.error('Error occurred in sendStatusUpdateEmail:', error);
    throw error;
  }
};

module.exports = {
  sendStatusUpdateEmail,
  transporter
};
