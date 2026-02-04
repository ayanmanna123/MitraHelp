const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Call Python face verification script
 * @param {Buffer} govIdBuffer - Government ID image buffer
 * @param {Buffer} selfieBuffer - Selfie image buffer
 * @returns {Promise<Object>} Verification result
 */
const verifyFacesWithPython = async (govIdBuffer, selfieBuffer) => {
    return new Promise((resolve, reject) => {
        // Create temporary file paths
        const timestamp = Date.now();
        const govIdPath = path.join(__dirname, `../temp/gov-id-${timestamp}.jpg`);
        const selfiePath = path.join(__dirname, `../temp/selfie-${timestamp}.jpg`);
        
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        try {
            // Write buffers to temporary files
            fs.writeFileSync(govIdPath, govIdBuffer);
            fs.writeFileSync(selfiePath, selfieBuffer);
            
            // Path to Python script (use consistent version)
            const pythonScript = path.join(__dirname, '../face_verification_consistent.py');
            
            // Spawn Python process
            const pythonProcess = spawn('python', [pythonScript, govIdPath, selfiePath]);
            
            let stdout = '';
            let stderr = '';
            
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                // Clean up temporary files
                try {
                    if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                    if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up temporary files:', cleanupError);
                }
                
                if (code !== 0) {
                    console.error('Python script exited with code:', code);
                    console.error('stderr:', stderr);
                    reject(new Error(`Python face verification failed: ${stderr}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse Python output: ${parseError.message}. Output: ${stdout}`));
                }
            });
            
            pythonProcess.on('error', (error) => {
                // Clean up on error
                try {
                    if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                    if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up temporary files:', cleanupError);
                }
                
                reject(new Error(`Failed to spawn Python process: ${error.message}`));
            });
            
        } catch (error) {
            // Clean up on error
            try {
                if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
            } catch (cleanupError) {
                console.warn('Warning: Could not clean up temporary files:', cleanupError);
            }
            
            reject(new Error(`Failed to prepare files for Python verification: ${error.message}`));
        }
    });
};

/**
 * Alternative method: Send base64 encoded images directly to Python
 * @param {Buffer} govIdBuffer - Government ID image buffer
 * @param {Buffer} selfieBuffer - Selfie image buffer
 * @returns {Promise<Object>} Verification result
 */
const verifyFacesWithPythonBase64 = async (govIdBuffer, selfieBuffer) => {
    return new Promise((resolve, reject) => {
        // Create temporary file paths
        const timestamp = Date.now();
        const govIdPath = path.join(__dirname, `../temp/gov-id-b64-${timestamp}.jpg`);
        const selfiePath = path.join(__dirname, `../temp/selfie-b64-${timestamp}.jpg`);
        
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        try {
            // Write buffers to temporary files
            fs.writeFileSync(govIdPath, govIdBuffer);
            fs.writeFileSync(selfiePath, selfieBuffer);
            
            // Path to Python script (use consistent version)
            const pythonScript = path.join(__dirname, '../face_verification_consistent.py');
            
            // Spawn Python process
            const pythonProcess = spawn('python', [pythonScript, govIdPath, selfiePath]);
            
            let stdout = '';
            let stderr = '';
            
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                // Clean up temporary files
                try {
                    if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                    if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up temporary files:', cleanupError);
                }
                
                if (code !== 0) {
                    console.error('Python script exited with code:', code);
                    console.error('stderr:', stderr);
                    reject(new Error(`Python face verification failed: ${stderr}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse Python output: ${parseError.message}. Output: ${stdout}`));
                }
            });
            
            pythonProcess.on('error', (error) => {
                // Clean up on error
                try {
                    if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                    if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up temporary files:', cleanupError);
                }
                
                reject(new Error(`Failed to spawn Python process: ${error.message}`));
            });
            
        } catch (error) {
            // Clean up on error
            try {
                if (fs.existsSync(govIdPath)) fs.unlinkSync(govIdPath);
                if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
            } catch (cleanupError) {
                console.warn('Warning: Could not clean up temporary files:', cleanupError);
            }
            
            reject(new Error(`Failed to prepare files for Python verification: ${error.message}`));
        }
    });
};

module.exports = {
    verifyFacesWithPython,
    verifyFacesWithPythonBase64
};
