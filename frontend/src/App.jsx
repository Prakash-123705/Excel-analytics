import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, UploadCloud, Settings, BarChart2, History, HelpCircle, LogOut, Loader2, AlertTriangle, Server, CheckCircle, Clock, Menu, X } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';
const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#eab308'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const App = () => {
    const [page, setPage] = useState('login');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedEmail = localStorage.getItem('userEmail');
        if (storedToken && storedEmail) {
            setToken(storedToken);
            setUser({ email: storedEmail, name: localStorage.getItem('userName') });
            setPage('dashboard');
        }
        setIsAuthLoading(false);
    }, []);

    const handleLogin = (userData, authToken) => {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userEmail', userData.email);
        if (userData.name) {
            localStorage.setItem('userName', userData.name);
        }
        setToken(authToken);
        setUser(userData);
        setPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        setToken(null);
        setUser(null);
        setPage('login');
    };

    const renderPage = () => {
        if (isAuthLoading) {
            return <LoadingState text="Initializing..." />;
        }
        if (!token || !user) {
            switch (page) {
                case 'signup':
                    return <AuthPage type="signup" onLogin={handleLogin} setPage={setPage} />;
                case 'login':
                default:
                    return <AuthPage type="login" onLogin={handleLogin} setPage={setPage} />;
            }
        }
        switch (page) {
            case 'history':
                return <HistoryPage token={token} />;
            case 'settings':
                return <SettingsPage user={user} />;
            case 'help':
                return <HelpPage />;
            case 'dashboard':
            default:
                return <Dashboard token={token} />;
        }
    };

    return (
        <div className="app-container">
            {user && token && (
                <>
                    <Sidebar currentPage={page} setPage={setPage} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mobile-menu-button">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </>
            )}
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
};

const Sidebar = ({ currentPage, setPage, onLogout, isOpen, setIsOpen }) => {
    const navItems = [
        { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'help', icon: HelpCircle, label: 'Help' },
    ];
    return (
        <aside className={`sidebar${isOpen ? ' open' : ''}`}>
            <div className="sidebar-header">
                <Server className="sidebar-logo" />
                <h1 className="sidebar-title">DataDash</h1>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => { setPage(item.id); setIsOpen(false); }}
                        className={`sidebar-nav-btn${currentPage === item.id ? ' active' : ''}`}>
                        <item.icon className="sidebar-nav-icon" />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="sidebar-nav-btn sidebar-logout">
                    <LogOut className="sidebar-nav-icon" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

const AuthPage = ({ type, onLogin, setPage }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMessage(''); setIsLoading(true);
        if (type === 'signup' && password !== confirmPassword) {
            setError("Passwords don't match."); setIsLoading(false); return;
        }
        if (!email || !password || (type === 'signup' && !name)) {
            setError("Please fill in all fields."); setIsLoading(false); return;
        }
        const endpoint = type === 'login' ? `${API_URL}/login` : `${API_URL}/register`;
        try {
            const body = type === 'login' ? { email, password } : { name, email, password };
            const response = await fetch(endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');
            if (type === 'login') {
                onLogin({ email: data.email, name: data.name }, data.token);
            } else {
                setSuccessMessage('Registration successful! Please log in.');
                setTimeout(() => setPage('login'), 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const title = type === 'login' ? 'Welcome Back' : 'Create Your Account';
    const subtitle = type === 'login' ? 'Sign in to continue' : 'Get started with a free account';
    const buttonText = type === 'login' ? 'Login' : 'Sign Up';
    const switchPrompt = type === 'login' ? "Don't have an account?" : "Already have an account?";
    const switchAction = type === 'login' ? 'Sign Up' : 'Login';
    const switchPage = type === 'login' ? 'signup' : 'login';

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card-header">
                    <h1 className="auth-title">{title}</h1>
                    <p className="auth-subtitle">{subtitle}</p>
                </div>
                {error && <Alert type="error" message={error} />}
                {successMessage && <Alert type="success" message={successMessage} />}
                <form onSubmit={handleSubmit} className="auth-form">
                    {type === 'signup' && <InputField label="Name" id="name" type="text" value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />}
                    <InputField label="Email Address" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                    <InputField label="Password" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    {type === 'signup' && <InputField label="Confirm Password" id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} />}
                    <button type="submit" disabled={isLoading} className="auth-btn">
                        {isLoading && <Loader2 className="loader-icon" style={{width: '1.25rem', height: '1.25rem', marginRight: '0.5rem'}} />}
                        {buttonText}
                    </button>
                </form>
                <p className="auth-switch">
                    {switchPrompt}{' '}
                    <button onClick={() => setPage(switchPage)} className="auth-switch-link">
                        {switchAction}
                    </button>
                </p>
            </div>
        </div>
    );
};

const InputField = ({ label, id, type, value, onChange, disabled }) => (
    <div className="auth-input-group">
        <label htmlFor={id} className="auth-label">{label}</label>
        <input id={id} name={id} type={type} required value={value} onChange={onChange} disabled={disabled} className="auth-input" />
    </div>
);

const Alert = ({ type, message }) => {
    const Icon = type === 'error' ? AlertTriangle : CheckCircle;
    return (
        <div className={`alert ${type}`} role="alert">
            <Icon className="alert-icon" />
            <span>{message}</span>
        </div>
    );
};

const GlassCard = ({ title, children, className }) => (
    <div className={`glass-card${className ? ` ${className}` : ''}`}>
        {title && <div className="glass-card-header"><h3 className="glass-card-title">{title}</h3></div>}
        <div className="glass-card-body">
            {children}
        </div>
    </div>
);

const PageWrapper = ({ title, children }) => (
    <div className="page-wrapper">
        <div className="page-header">
            <h1 className="page-title">{title}</h1>
        </div>
        {children}
    </div>
);

const Dashboard = ({ token }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [section, setSection] = useState('analysis'); // Section toggle

    useEffect(() => {
        const name = localStorage.getItem('userName') || localStorage.getItem('userEmail')?.split('@')[0] || 'User';
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }, []);

    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        setIsLoading(true); setError(null); setAnalysisData(null); setFileName('');
        if (fileRejections.length > 0) {
            setError(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`); setIsLoading(false); return;
        }
        const file = acceptedFiles[0];
        if (!file) { setIsLoading(false); return; }
        setFileName(file.name);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST', headers: { 'x-access-token': token }, body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Upload failed.');
            setAnalysisData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxSize: MAX_FILE_SIZE, multiple: false,
    });

    if (isLoading) return <LoadingState text="Analyzing your data..." />;
    if (error) return <ErrorState message={error} />;

    if (!analysisData) {
        return (
            <PageWrapper title={`Welcome, ${userName}!`}>
                <p className="page-subtitle" style={{marginTop: '-1.5rem', marginBottom: '2rem'}}>Ready to turn your data into insights? Upload a file to get started.</p>
                <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="dropzone-icon" />
                    <p><span className="dropzone-text-bold">Click to upload</span> or drag and drop</p>
                    <p className="dropzone-text-light">Excel or CSV files (max. 10MB)</p>
                </div>
            </PageWrapper>
        );
    }

    // Section buttons and conditional rendering
    return (
        <PageWrapper title={`Dashboard for: ${fileName}`}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    className={`dashboard-section-btn${section === 'analysis' ? ' active' : ''}`}
                    style={{
                        background: section === 'analysis' ? 'var(--primary-blue)' : 'var(--content-bg)',
                        color: section === 'analysis' ? '#fff' : 'var(--text-dark)',
                        border: '1px solid var(--primary-blue)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1.5rem',
                        fontWeight: 600,
                        boxShadow: section === 'analysis' ? '0 2px 8px rgba(59,130,246,0.08)' : 'none',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                    }}
                    onClick={() => setSection('analysis')}
                >
                    Analysis
                </button>
                <button
                    className={`dashboard-section-btn${section === 'summary' ? ' active' : ''}`}
                    style={{
                        background: section === 'summary' ? 'var(--primary-blue)' : 'var(--content-bg)',
                        color: section === 'summary' ? '#fff' : 'var(--text-dark)',
                        border: '1px solid var(--primary-blue)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1.5rem',
                        fontWeight: 600,
                        boxShadow: section === 'summary' ? '0 2px 8px rgba(59,130,246,0.08)' : 'none',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                    }}
                    onClick={() => setSection('summary')}
                >
                    Summary
                </button>
            </div>
            <div className="dashboard-grid">
                {section === 'summary' && (
                    <div className="dashboard-grid-main">
                        <DataSummary summary={analysisData.summary} />
                        <GlassCard title="Dataset Overview">
                            <div className="overview-grid">
                                <div><p className="overview-value blue">{analysisData.summary.totalRows}</p><p className="overview-label">Rows</p></div>
                                <div><p className="overview-value blue">{analysisData.summary.totalCols}</p><p className="overview-label">Columns</p></div>
                                <div><p className="overview-value yellow">{analysisData.summary.totalMissing}</p><p className="overview-label">Missing</p></div>
                                <div><p className="overview-value green">{(analysisData.summary.totalRows > 0 ? (((analysisData.summary.totalRows * analysisData.summary.totalCols) - analysisData.summary.totalMissing) / (analysisData.summary.totalRows * analysisData.summary.totalCols) * 100).toFixed(1) : 0)}%</p><p className="overview-label">Complete</p></div>
                            </div>
                        </GlassCard>
                        <GlassCard title="Column Analysis">
                            <ul className="column-analysis-list">
                                {analysisData.summary.headers.map(h => (
                                    <li key={h} className="column-analysis-item">
                                        <span className="column-analysis-name" title={h}>{h}</span>
                                        <div className="column-analysis-meta">
                                            <span className={`column-type-badge ${analysisData.summary.dataTypes[h].toLowerCase()}`}>{analysisData.summary.dataTypes[h]}</span>
                                            {analysisData.summary.missingValues[h] > 0 && <span className="column-missing-value">{analysisData.summary.missingValues[h]} missing</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    </div>
                )}
                {section === 'analysis' && (
                    <div className="dashboard-grid-side" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%'}}>
                        <DynamicChartGallery charts={analysisData.charts} />
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

const DataSummary = ({ summary }) => {
    const { headers, previewData } = summary;
    return (
        <GlassCard title="Data Preview (Top 5 Rows)">
             <div style={{ overflowX: 'auto' }}>
                <table className="data-preview-table">
                    <thead>
                        <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {previewData.map((row, i) => (
                            <tr key={i}>
                                {headers.map(h => <td key={h}>{String(row[h])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const DynamicChartGallery = ({ charts }) => {
    if (!charts || Object.keys(charts).length === 0) {
        return (
            <GlassCard>
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <AlertTriangle style={{margin: '0 auto 1rem', width: '2rem', height: '2rem', color: '#facc15'}} />
                    <h3>Not Enough Data for Charts</h3>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-dark)'}}>The backend couldn't generate charts.</p>
                </div>
            </GlassCard>
        );
    }
    return (
        <>
            {Object.entries(charts).map(([type, chartData]) => {
                if (!chartData) return null;
                // Dynamically render chart types
                if (chartData.type === 'pie' || type === 'pie') {
                    return (
                        <GlassCard key={type} title={`Distribution of ${chartData.name}`}>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={chartData.data} dataKey={chartData.value} nameKey={chartData.name} cx="50%" cy="50%" outerRadius={80} label>
                                        {chartData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    );
                }
                if (chartData.type === 'bar' || type === 'bar') {
                    return (
                        <GlassCard key={type} title={`Bar Chart: ${chartData.x} vs ${chartData.y}`}>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey={chartData.x} stroke="var(--text-dark)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="var(--text-dark)" tick={{ fontSize: 12 }}/>
                                    <Tooltip contentStyle={{backgroundColor: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem'}} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}/>
                                    <Bar dataKey={chartData.y} fill={COLORS[0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    );
                }
                if (chartData.type === 'line' || type === 'line') {
                    return (
                        <GlassCard key={type} title={`Line Chart: Trend of ${chartData.y}`}>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey={chartData.x} stroke="var(--text-dark)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="var(--text-dark)" tick={{ fontSize: 12 }}/>
                                    <Tooltip contentStyle={{backgroundColor: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem'}} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}/>
                                    <Line type="monotone" dataKey={chartData.y} stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4, fill: COLORS[1] }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    );
                }
                // Add more chart types here as needed
                return (
                    <GlassCard key={type} title={`Chart: ${type}`}>
                        <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-dark)'}}>
                            <p>Chart type <strong>{type}</strong> is not supported in the UI yet.</p>
                        </div>
                    </GlassCard>
                );
            })}
        </>
    );
};

const HistoryPage = ({ token }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/history`, { headers: { 'x-access-token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
                setHistory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    return (
        <PageWrapper title="Upload History">
            <GlassCard>
                {isLoading && <LoadingState text="Fetching history..." />}
                {error && <ErrorState message={error} />}
                {!isLoading && !error && (
                    <div className="history-list">
                        {history.length === 0 ? (
                            <p style={{textAlign: 'center', color: 'var(--text-dark)'}}>You have no upload history yet.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.upload_time} className="history-item">
                                    <div className="history-info">
                                        <FileText size={20} style={{color: 'var(--primary-blue)', marginRight: '1rem', flexShrink: 0}} />
                                        <div>
                                            <div className="history-filename">{item.filename}</div>
                                            <div className="history-user">User: {item.user_email}</div>
                                        </div>
                                    </div>
                                    <div className="history-meta">
                                        <Clock size={14} style={{marginRight: '0.5rem'}}/>
                                        <span>{new Date(item.upload_time).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </GlassCard>
        </PageWrapper>
    );
};

const SettingsPage = ({ user }) => (
    <PageWrapper title="Settings">
        <div style={{maxWidth: '600px'}}>
            <div className="settings-group">
                <GlassCard title="Profile Information">
                    <label className="settings-label">Email Address</label>
                    <div className="settings-value">{user.email}</div>
                </GlassCard>
            </div>
            <div className="settings-group">
                <GlassCard title="Change Password">
                    <form className="auth-form" style={{gap: '1rem'}}>
                        <InputField label="Current Password" id="current-password" type="password" disabled />
                        <InputField label="New Password" id="new-password" type="password" disabled />
                        <button type="submit" disabled className="auth-btn">Update Password (Disabled)</button>
                    </form>
                </GlassCard>
            </div>
        </div>
    </PageWrapper>
);

const HelpPage = () => (
    <PageWrapper title="Help & Support">
        <GlassCard>
            <div className="help-text">
                <p><strong>1. Sign Up:</strong> Create a new account from the main page using your name, email, and a secure password.</p>
                <p><strong>2. Login:</strong> Use your credentials to access your personal dashboard.</p>
                <p><strong>3. Upload:</strong> On the dashboard, drag and drop a CSV or Excel file onto the designated area, or click it to open a file browser.</p>
                <p><strong>4. Analyze:</strong> The application will automatically process your file and generate a data preview, key statistics, and charts.</p>
                <p><strong>5. History:</strong> Visit the History page from the sidebar to see a list of all your past file uploads, including filenames and timestamps.</p>
            </div>
        </GlassCard>
    </PageWrapper>
);


const LoadingState = ({ text = "Loading..." }) => (
    <div className="loading-state">
        <Loader2 className="loader-icon" />
        <p>{text}</p>
    </div>
);

const ErrorState = ({ message }) => (
    <GlassCard>
        <div style={{textAlign: 'center', padding: '2rem'}}>
            <AlertTriangle style={{margin: '0 auto 1rem', width: '2.5rem', height: '2.5rem', color: 'var(--error-color)'}} />
            <h3>An Error Occurred</h3>
            <p style={{fontSize: '0.9rem', color: 'var(--text-dark)'}}>{message}</p>
        </div>
    </GlassCard>
);

export default App;