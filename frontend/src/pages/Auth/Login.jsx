import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import AuthLayout from './AuthLayout';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, user } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            return addToast('Please fill all fields', 'warning');
        }

        setIsLoading(true);
        try {
            await login(email, password);
            addToast('Logged in successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to login', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Track what deserves a rewatch"
            headline="Step back into your watch vault and relive your cinematic universe."
            description="Jump from discovery to lists, ratings, and watch history without losing the visual identity of the landing experience."
            cardTitle="Welcome Back"
            cardSubtitle="Sign in to continue tracking your watched list"
            footer={<p>Don&apos;t have an account? <Link to="/register">Sign up</Link></p>}
        >
            <form onSubmit={handleSubmit} className="auth-form">
                <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button type="submit" fullWidth isLoading={isLoading} className="auth-submit-button">
                    Sign In
                </Button>
            </form>
        </AuthLayout>
    );
};

export default Login;
