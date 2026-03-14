import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import AuthLayout from './AuthLayout';
import './Auth.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, user } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            return addToast('Please fill all fields', 'warning');
        }

        if (password !== confirmPassword) {
            return addToast('Passwords do not match', 'error');
        }

        setIsLoading(true);
        try {
            await register(username, email, password);
            addToast('Account created successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to create account', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const highlights = [
        { value: 'AI Picks', label: 'Faster recommendations matched to your vibe' },
        { value: 'History', label: 'Keep every movie, series, and anime in one timeline' },
        { value: 'Lists', label: 'Build curated collections worth sharing' }
    ];

    return (
        <AuthLayout
            eyebrow="Build your collection in style"
            headline="Create your account and step into your personal world of movies and serie"
            description="Start with a cinematic backdrop, then move straight into ratings, AI suggestions, watch history, and custom lists."
            cardTitle="Create Account"
            cardSubtitle="Join MyWatchedList today"
            highlights={highlights}
            footer={<p>Already have an account? <Link to="/login">Sign in</Link></p>}
        >
            <form onSubmit={handleSubmit} className="auth-form">
                <Input
                    label="Username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button type="submit" fullWidth isLoading={isLoading} className="auth-submit-button">
                    Sign Up
                </Button>
            </form>
        </AuthLayout>
    );
};

export default Register;
