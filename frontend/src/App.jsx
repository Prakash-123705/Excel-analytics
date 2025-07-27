import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, UploadCloud, Settings, BarChart2, History, HelpCircle, LogOut, Loader2, AlertTriangle, Server, CheckCircle, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const App = () => {
    const [page, setPage] = useState('login');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedEmail = localStorage.getItem('userEmail');
        if (storedToken && storedEmail) {
            setToken(storedToken);
            setUser({ email: storedEmail });
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
        setToken(null);
        setUser(null);
        setPage('login');
    };

    const renderPage = () => {
        if (isAuthLoading) {
            return <LoadingState text="Loading..." />;
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
        <div>
            {user && token && <Sidebar currentPage={page} setPage={setPage} onLogout={handleLogout} />}
            <main className={user && token ? "main-content" : "main-content full"}>
                {renderPage()}
            </main>
        </div>
    );
};

// --- Sidebar ---
const Sidebar = ({ currentPage, setPage, onLogout }) => {
    const navItems = [
        { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'help', icon: HelpCircle, label: 'Help' },
    ];
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <Server className="sidebar-logo" />
                <h1 className="sidebar-title">DataDash</h1>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setPage(item.id)}
                        className={`sidebar-nav-btn${currentPage === item.id ? ' active' : ''}`}>
                        <item.icon className="sidebar-nav-icon" />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="sidebar-logout">
                    <LogOut className="sidebar-nav-icon" />
                    Logout
                </button>
            </div>
        </div>
    );
};

// --- Auth ---
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
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (type === 'signup' && password !== confirmPassword) {
            setError("Passwords don't match.");
            setIsLoading(false);
            return;
        }
        if (!email || !password || (type === 'signup' && !name)) {
            setError("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        const endpoint = type === 'login' ? `${API_URL}/login` : `${API_URL}/register`;
        try {
            const body = type === 'login' ? { email, password } : { name, email, password };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');
            if (type === 'login') {
                // Save name if available
                if (data.name) localStorage.setItem('userName', data.name);
                onLogin({ email: data.email, name: data.name }, data.token);
            } else {
                // Save name on signup
                if (name) localStorage.setItem('userName', name);
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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-title">{title}</div>
                <div className="auth-subtitle">{subtitle}</div>
                {error && <Alert type="error" message={error} />}
                {successMessage && <Alert type="success" message={successMessage} />}
                <form onSubmit={handleSubmit} className="auth-form">
                    {type === 'signup' && (
                        <InputField label="Name" id="name" type="text" value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
                    )}
                    <InputField label="Email Address" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                    <InputField label="Password" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    {type === 'signup' && (
                        <InputField label="Confirm Password" id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} />
                    )}
                    <button type="submit" disabled={isLoading} className={`auth-btn${isLoading ? ' loading' : ''}`}>
                        {isLoading && <Loader2 className="loader-icon" />}
                        {buttonText}
                    </button>
                </form>
                <p className="auth-switch-text">
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
    <div>
        <label htmlFor={id} className="auth-label">{label}</label>
        <input id={id} name={id} type={type} required value={value} onChange={onChange} disabled={disabled} className="auth-input" />
    </div>
);

const Alert = ({ type, message }) => {
    const alertClass = type === 'error' ? 'alert alert-error' : 'alert alert-success';
    const Icon = type === 'error' ? AlertTriangle : CheckCircle;
    return (
        <div className={alertClass} role="alert">
            <Icon style={{ width: '1.25em', height: '1.25em' }} />
            <span>{message}</span>
        </div>
    );
};

// --- Dashboard ---
const Dashboard = ({ token }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Always use full name from localStorage if available
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
        } else {
            const storedEmail = localStorage.getItem('userEmail');
            if (storedEmail) {
                const name = storedEmail.split('@')[0];
                setUserName(name.charAt(0).toUpperCase() + name.slice(1));
            }
        }
    }, []);

    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        setIsLoading(true);
        setError(null);
        setAnalysisData(null);
        setFileName('');
        if (fileRejections.length > 0) {
            setError(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            setIsLoading(false);
            return;
        }
        const file = acceptedFiles[0];
        if (!file) {
            setIsLoading(false);
            return;
        }
        setFileName(file.name);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'x-access-token': token },
                body: formData,
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

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxSize: MAX_FILE_SIZE,
        multiple: false,
    });

    const renderContent = () => {
        if (isLoading) return <LoadingState text="Analyzing your data..." />;
        if (error) return <ErrorState message={error} />;
        if (!analysisData) {
            // Show welcome board before import
            return (
                <div className="dashboard-content">
                    <div className="dashboard-welcome">Welcome {userName}!</div>
                    <div style={{ marginBottom: '2em' }}>
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <button className="import-btn">
                                <UploadCloud style={{ marginRight: '0.5em' }} />
                                Click to upload or drag and drop<br />
                                <span style={{ fontWeight: 400, fontSize: '0.95em' }}>Excel or CSV files (max. 10MB)</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div>
                        <h2 className="dashboard-title">Dashboard for: <span className="dashboard-filename">{fileName}</span></h2>
                        <p className="dashboard-desc">Analysis generated by the backend.</p>
                    </div>
                    <div {...getRootProps()} className="dashboard-upload">
                        <input {...getInputProps()} />
                        <button className="import-btn">
                            <UploadCloud className="dashboard-upload-icon" />
                            Upload New File
                        </button>
                    </div>
                </div>
                <div className="dashboard-tabs">
                    <nav className="dashboard-tabs-nav" aria-label="Tabs">
                        <TabButton name="Summary" tabId="summary" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton name="Charts" tabId="charts" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </nav>
                </div>
                {activeTab === 'summary' && analysisData.summary && <DataSummary summary={analysisData.summary} />}
                {activeTab === 'charts' && analysisData.charts && <ChartGallery charts={analysisData.charts} />}
                {activeTab === 'summary' && !analysisData.summary && (
                    <GlassCard>
                        <div className="dashboard-empty">
                            <AlertTriangle className="dashboard-empty-icon" />
                            <h3 className="dashboard-empty-title">No Summary Data</h3>
                            <p className="dashboard-empty-desc">No summary data was returned from the backend.</p>
                        </div>
                    </GlassCard>
                )}
                {activeTab === 'charts' && !analysisData.charts && (
                    <GlassCard>
                        <div className="dashboard-empty">
                            <AlertTriangle className="dashboard-empty-icon" />
                            <h3 className="dashboard-empty-title">No Chart Data</h3>
                            <p className="dashboard-empty-desc">No chart data was returned from the backend.</p>
                        </div>
                    </GlassCard>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            {renderContent()}
        </div>
    );
};

const TabButton = ({ name, tabId, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(tabId)} className={`tab-btn${activeTab === tabId ? ' active' : ''}`}>
        {name}
    </button>
);

const Dropzone = ({ isDragActive, getRootProps, getInputProps }) => (
    <div className="dropzone-wrapper">
        <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`}>
            <input {...getInputProps()} />
            <UploadCloud className={`dropzone-icon${isDragActive ? ' active' : ''}`} />
            <p className="dropzone-title"><span className="dropzone-title-bold">Click to upload</span> or drag and drop</p>
            <p className="dropzone-desc">Excel or CSV files (max. 10MB)</p>
        </div>
    </div>
);

const LoadingState = ({ text = "Loading..." }) => (
    <div className="loading-state">
        <Loader2 className="loader-icon" />
        <p className="loading-text">{text}</p>
    </div>
);

const ErrorState = ({ message }) => (
    <div className="error-state">
        <AlertTriangle className="error-icon" />
        <p className="error-title">An Error Occurred</p>
        <p className="error-message">{message}</p>
    </div>
);

const GlassCard = ({ title, children, className }) => (
    <div className={`glass-card ${className || ''}`}>
        {title && <h3 className="glass-card-title">{title}</h3>}
        {children}
    </div>
);

const DataSummary = ({ summary }) => {
    const { headers, previewData, totalRows, totalCols, totalMissing, dataTypes } = summary;
    const completeness = totalRows > 0 ? (((totalRows * totalCols) - totalMissing) / (totalRows * totalCols) * 100).toFixed(1) : 0;
    return (
        <div className="data-summary-grid">
            <GlassCard title="Data Preview (Top 5 Rows)">
                <div className="data-summary-table-wrapper">
                    <table className="data-summary-table">
                        <thead className="data-summary-table-head">
                            <tr>{headers.map(h => <th key={h} scope="col" className="data-summary-table-th">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, i) => (
                                <tr key={i} className="data-summary-table-row">
                                    {headers.map(h => <td key={h} className="data-summary-table-td">{String(row[h])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
            <div className="data-summary-side">
                <GlassCard title="Dataset Overview">
                    <div className="data-summary-overview-grid">
                        <div><p className="overview-value rows">{totalRows}</p><p className="overview-label">Rows</p></div>
                        <div><p className="overview-value cols">{totalCols}</p><p className="overview-label">Columns</p></div>
                        <div><p className="overview-value missing">{totalMissing}</p><p className="overview-label">Missing Values</p></div>
                        <div><p className="overview-value completeness">{completeness}%</p><p className="overview-label">Completeness</p></div>
                    </div>
                </GlassCard>
                <GlassCard title="Column Analysis">
                    <div className="column-analysis-list-wrapper">
                        <ul className="column-analysis-list">
                            {headers.map(h => (
                                <li key={h} className="column-analysis-item">
                                    <span className="column-analysis-header" title={h}>{h}</span>
                                    <div className="column-analysis-meta">
                                        <span className={`column-type${dataTypes[h] === 'Numeric' ? ' numeric' : ' categorical'}`}>{dataTypes[h]}</span>
                                        <span className={`column-missing${summary.missingValues[h] > 0 ? ' missing' : ''}`}>{summary.missingValues[h]} missing</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

const ChartGallery = ({ charts }) => {
    if (Object.keys(charts).length === 0) {
        return (
            <GlassCard>
                <div className="dashboard-empty">
                    <AlertTriangle className="dashboard-empty-icon" />
                    <h3 className="dashboard-empty-title">Not Enough Data for Charts</h3>
                    <p className="dashboard-empty-desc">The backend couldn't generate charts. Ensure your data has at least one numeric and one categorical column.</p>
                </div>
            </GlassCard>
        );
    }
    const { bar, line, pie } = charts;
    return (
        <div className="chart-gallery-grid">
            <GlassCard title={`Bar Chart: ${bar.x} vs ${bar.y}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bar.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey={bar.x} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} cursor={{ fill: 'rgba(147,197,253,0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                        <Bar dataKey={bar.y} fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>
            <GlassCard title={`Line Chart: Trend of ${line.y}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={line.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey={line.x} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} cursor={{ fill: 'rgba(147,197,253,0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                        <Line type="monotone" dataKey={line.y} stroke="#84cc16" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </GlassCard>
            <GlassCard title={`Pie Chart: Distribution of ${pie.name}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={pie.data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey={pie.value} nameKey={pie.name} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pie.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                    </PieChart>
                </ResponsiveContainer>
            </GlassCard>
        </div>
    );
};

// --- History ---
const HistoryPage = ({ token }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/history`, {
                    headers: { 'x-access-token': token }
                });
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
        <div className="main-content">
            <h1 className="glass-card-title">Upload History</h1>
            <div style={{ maxWidth: '600px', marginLeft: 0, width: '100%' }}>
                <GlassCard>
                    {isLoading && <LoadingState text="Fetching history..." />}
                    {error && <ErrorState message={error} />}
                    {!isLoading && !error && (
                        <div className="history-list">
                            {history.length === 0 ? (
                                <p className="dashboard-empty-desc">You have no upload history yet.</p>
                            ) : (
                                history.map(item => (
                                    <div key={item.upload_time} className="history-card">
                                        <div>
                                            <div className="history-filename">{item.filename}</div>
                                            <div className="history-user">User: {item.user_email}</div>
                                        </div>
                                        <div className="history-meta">
                                            <Clock style={{ width: '1em', height: '1em' }} />
                                            <span className="history-date">{new Date(item.upload_time).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

// --- Settings ---
const SettingsPage = ({ user }) => (
    <div className="main-content">
        <h1 className="glass-card-title">Settings</h1>
        <div style={{ maxWidth: '600px', marginLeft: 0 }}>
            <GlassCard title="Profile Information">
                <div>
                    <label className="auth-label">Email</label>
                    <p className="settings-email">{user.email}</p>
                </div>
            </GlassCard>
            <GlassCard title="Change Password">
                <form>
                    <InputField label="Current Password" id="current-password" type="password" disabled />
                    <InputField label="New Password" id="new-password" type="password" disabled />
                    <button type="submit" disabled className="auth-btn">Update Password (Disabled)</button>
                </form>
            </GlassCard>
        </div>
    </div>
);

// --- Help ---
const HelpPage = () => (
    <div className="main-content">
        <div style={{ maxWidth: '600px', marginLeft: 0 }}>
            <GlassCard className="help-card">
                <div style={{ textAlign: 'center', padding: '2em' }}>
                    <HelpCircle className="help-icon" />
                    <h3 className="glass-card-title">How to Use DataDash</h3>
                    <div style={{ marginTop: '1em', textAlign: 'left' }}>
                        <p>1. <strong>Sign Up:</strong> Create a new account from the main page.</p>
                        <p>2. <strong>Login:</strong> Use your credentials to access your dashboard.</p>
                        <p>3. <strong>Upload:</strong> On the dashboard, drag & drop or click to upload a CSV or Excel file.</p>
                        <p>4. <strong>Analyze:</strong> The backend will automatically process your file and generate a data summary and interactive charts.</p>
                        <p>5. <strong>History:</strong> Visit the History page to see a list of all your past uploads.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    </div>
);

export default App;