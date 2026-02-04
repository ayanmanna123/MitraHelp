import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const GoogleLoginButton = ({ text = "Continue with Google", className = "" }) => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const success = await googleLogin(credentialResponse.credential);
                if (success) {
                    navigate('/dashboard');
                }
            } else {
                toast.error("Google login failed: Try again.");
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            toast.error("An error occurred during Google login.");
        }
    };

    const handleError = () => {
        toast.error("Google Login Failed");
        console.error("Google Login Failed");
    };

    return (
        <div className={`flex justify-center w-full ${className}`}>
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                text="continue_with"
                width="100%"
            />
        </div>
    );
};

export default GoogleLoginButton;
