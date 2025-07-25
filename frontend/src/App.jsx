
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, UploadCloud, Settings, BarChart2, History, HelpCircle, LogOut, Loader2, AlertTriangle, Server, CheckCircle, Clock } from 'lucide-react';
// Removed import './index.css'; to ensure CSS is only imported in main.jsx

// --- Configuration ---
const API_URL = 'http://localhost:5001/api'; // Backend URL

// --- Helper Functions & Constants ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [page, setPage] = useState('login'); // login, signup, dashboard, history, settings, help
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // --- Check for existing token on initial load ---
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

    // --- Authentication Handlers ---
    const handleLogin = (userData, authToken) => {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userEmail', userData.email);
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

    // --- View Renderer ---
    const renderPage = () => {
        if (isAuthLoading) {
            return <div className="w-full h-screen flex items-center justify-center bg-gray-900"><Loader2 className="w-16 h-16 text-blue-400 animate-spin" /></div>;
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
        <div className="min-h-screen w-full bg-gray-900 text-gray-100 font-sans flex">
            {user && token && <Sidebar currentPage={page} setPage={setPage} onLogout={handleLogout} />}
            <main className={`flex-1 transition-all duration-300 ${user && token ? 'ml-64' : 'ml-0'}`}>
                {renderPage()}
            </main>
        </div>
    );
};

// --- Authentication Page ---
const AuthPage = ({ type, onLogin, setPage }) => {
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
        if (!email || !password) {
            setError("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        const endpoint = type === 'login' ? `${API_URL}/login` : `${API_URL}/register`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An unknown error occurred.');
            }

            if (type === 'login') {
                onLogin({ email: data.email }, data.token);
            } else { // signup
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                    <p className="text-gray-400">{subtitle}</p>
                </div>
                {error && <Alert type="error" message={error} />}
                {successMessage && <Alert type="success" message={successMessage} />}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField label="Email Address" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    <InputField label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    {type === 'signup' && (
                        <InputField label="Confirm Password" id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`auth-btn${isLoading ? ' loading' : ''}`}
                    >
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

// --- Reusable Components ---
const InputField = ({ label, id, type, value, onChange, disabled }) => (
    <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-300 block mb-2">{label}</label>
        <input id={id} name={id} type={type} required value={value} onChange={onChange} disabled={disabled}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
    </div>
);

const Alert = ({ type, message }) => {
    const colors = {
        error: 'bg-red-500/20 border-red-500 text-red-300',
        success: 'bg-green-500/20 border-green-500 text-green-300',
    };
    const Icon = type === 'error' ? AlertTriangle : CheckCircle;
    return (
        <div className={`${colors[type]} border px-4 py-3 rounded-lg flex items-center`} role="alert">
            <Icon className="w-5 h-5 mr-3" />
            <span className="block sm:inline text-sm">{message}</span>
        </div>
    );
};

const GlassCard = ({ title, children, className }) => (
    <div className={`bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-lg p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
        {children}
    </div>
);

// --- Sidebar Component ---
const Sidebar = ({ currentPage, setPage, onLogout }) => {
    const navItems = [
        { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'help', icon: HelpCircle, label: 'Help' },
    ];

    return (
        <div className="fixed top-0 left-0 h-full w-64 bg-gray-900/70 backdrop-blur-lg border-r border-gray-700/50 flex flex-col z-30">
            <div className="flex items-center justify-center h-20 border-b border-gray-700/50">
                <Server className="text-blue-400 h-8 w-8" />
                <h1 className="text-2xl font-bold ml-2 text-white">DataDash</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setPage(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === item.id 
                            ? 'bg-blue-600/30 text-blue-300' 
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="px-4 py-6 border-t border-gray-700/50">
                <button onClick={onLogout} className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-400 rounded-lg hover:bg-gray-700/50 hover:text-gray-200 transition-all duration-200">
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

// --- Dashboard Component ---
const Dashboard = ({ token }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

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

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Upload failed.');
            }
            
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
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxSize: MAX_FILE_SIZE,
        multiple: false,
    });

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState text="Analyzing your data..." />;
        }
        if (error) {
            return <ErrorState message={error} />;
        }
        if (!analysisData) {
            return <Dropzone isDragActive={isDragActive} getRootProps={getRootProps} getInputProps={getInputProps} />;
        }

        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Dashboard for: <span className="text-blue-400">{fileName}</span></h2>
                        <p className="text-gray-400">Analysis generated by the backend.</p>
                    </div>
                    <div {...getRootProps()} className="inline-block">
                        <input {...getInputProps()} />
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                            <UploadCloud className="w-4 h-4 mr-2" />
                            Upload New File
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton name="Summary" tabId="summary" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton name="Charts" tabId="charts" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </nav>
                </div>

                {activeTab === 'summary' && analysisData.summary && <DataSummary summary={analysisData.summary} />}
                {activeTab === 'charts' && analysisData.charts && <ChartGallery charts={analysisData.charts} />}
                {/* Optionally, show a fallback if summary/charts are missing */}
                {activeTab === 'summary' && !analysisData.summary && (
                    <GlassCard>
                        <div className="text-center py-10">
                            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                            <h3 className="mt-2 text-lg font-medium text-white">No Summary Data</h3>
                            <p className="mt-1 text-sm text-gray-400">No summary data was returned from the backend.</p>
                        </div>
                    </GlassCard>
                )}
                {activeTab === 'charts' && !analysisData.charts && (
                    <GlassCard>
                        <div className="text-center py-10">
                            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                            <h3 className="mt-2 text-lg font-medium text-white">No Chart Data</h3>
                            <p className="mt-1 text-sm text-gray-400">No chart data was returned from the backend.</p>
                        </div>
                    </GlassCard>
                )}
            </div>
        );
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
            {renderContent()}
        </div>
    );
};

const TabButton = ({ name, tabId, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(tabId)}
        className={`${
            activeTab === tabId
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
    >
        {name}
    </button>
);

// --- Dashboard Sub-components ---
const Dropzone = ({ isDragActive, getRootProps, getInputProps }) => (
    <div className="flex items-center justify-center w-full h-full">
        <div {...getRootProps()} 
            className={`flex flex-col items-center justify-center w-full max-w-2xl h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-blue-400 bg-blue-900/30' : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'}`}
        >
            <input {...getInputProps()} />
            <UploadCloud className={`w-16 h-16 mb-4 transition-transform duration-300 ${isDragActive ? 'transform scale-110 text-blue-300' : 'text-gray-500'}`} />
            <p className="mb-2 text-lg text-gray-300"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-sm text-gray-500">Excel or CSV files (max. 10MB)</p>
        </div>
    </div>
);

const LoadingState = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center w-full h-full">
        <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
        <p className="text-lg text-gray-300">{text}</p>
    </div>
);

const ErrorState = ({ message }) => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-red-900/20 p-8 rounded-2xl border border-red-500/50">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-lg text-red-300 font-semibold">An Error Occurred</p>
        <p className="text-sm text-red-400 text-center mt-2">{message}</p>
    </div>
);

const DataSummary = ({ summary }) => {
    const { headers, previewData, totalRows, totalCols, totalMissing, dataTypes } = summary;
    const completeness = totalRows > 0 ? (((totalRows * totalCols) - totalMissing) / (totalRows * totalCols) * 100).toFixed(1) : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard title="Data Preview (Top 5 Rows)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>{headers.map(h => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, i) => (
                                <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30">
                                    {headers.map(h => <td key={h} className="px-4 py-3 whitespace-nowrap">{String(row[h])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
            <div className="space-y-6">
                <GlassCard title="Dataset Overview">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div><p className="text-3xl font-bold text-blue-400">{totalRows}</p><p className="text-sm text-gray-400">Rows</p></div>
                        <div><p className="text-3xl font-bold text-blue-400">{totalCols}</p><p className="text-sm text-gray-400">Columns</p></div>
                        <div><p className="text-3xl font-bold text-yellow-400">{totalMissing}</p><p className="text-sm text-gray-400">Missing Values</p></div>
                        <div><p className="text-3xl font-bold text-green-400">{completeness}%</p><p className="text-sm text-gray-400">Completeness</p></div>
                    </div>
                </GlassCard>
                <GlassCard title="Column Analysis">
                     <div className="overflow-y-auto max-h-60 pr-2">
                        <ul className="space-y-3">
                            {headers.map(h => (
                                <li key={h} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-gray-200 truncate pr-4" title={h}>{h}</span>
                                    <div className="flex items-center space-x-4 flex-shrink-0">
                                        <span className={`px-2 py-1 text-xs rounded-full ${dataTypes[h] === 'Numeric' ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>{dataTypes[h]}</span>
                                        <span className={`font-mono text-xs ${summary.missingValues[h] > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>{summary.missingValues[h]} missing</span>
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
                <div className="text-center py-10">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                    <h3 className="mt-2 text-lg font-medium text-white">Not Enough Data for Charts</h3>
                    <p className="mt-1 text-sm text-gray-400">The backend couldn't generate charts. Ensure your data has at least one numeric and one categorical column.</p>
                </div>
            </GlassCard>
        );
    }

    const { bar, line, pie } = charts;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GlassCard title={`Bar Chart: ${bar.x} vs ${bar.y}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bar.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey={bar.x} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}/>
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Bar dataKey={bar.y} fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>
            <GlassCard title={`Line Chart: Trend of ${line.y}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={line.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey={line.x} stroke="#9ca3af" tick={{ fontSize: 12 }}/>
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} cursor={{ fill: 'rgba(147, 197, 253, 0.1)' }}/>
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
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
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}/>
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                    </PieChart>
                </ResponsiveContainer>
            </GlassCard>
        </div>
    );
};

// --- Other Pages ---
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
        <div className="p-8 h-full overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
            <h1 className="text-3xl font-bold text-white mb-8">Upload History</h1>
            <GlassCard>
                {isLoading && <LoadingState text="Fetching history..." />}
                {error && <ErrorState message={error} />}
                {!isLoading && !error && (
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">You have no upload history yet.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.upload_time} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center">
                                        <FileText className="w-6 h-6 mr-4 text-blue-400" />
                                        <div>
                                            <p className="font-semibold text-white">{item.filename}</p>
                                            <p className="text-sm text-gray-400">User: {item.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-400">
                                        <Clock className="w-4 h-4 mr-2"/>
                                        {new Date(item.upload_time).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

const SettingsPage = ({ user }) => (
    <div className="p-8 h-full bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
        <div className="max-w-2xl mx-auto space-y-6">
            <GlassCard title="Profile Information">
                <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    <p className="mt-1 text-lg text-white p-3 bg-gray-700/50 rounded-lg">{user.email}</p>
                </div>
            </GlassCard>
            <GlassCard title="Change Password">
                <form className="space-y-4">
                    <InputField label="Current Password" id="current-password" type="password" disabled />
                    <InputField label="New Password" id="new-password" type="password" disabled />
                    <button type="submit" disabled className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">Update Password (Disabled)</button>
                </form>
            </GlassCard>
        </div>
    </div>
);

const HelpPage = () => (
    <div className="p-8 h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
        <GlassCard className="max-w-3xl">
            <div className="text-center py-10 px-6">
                <HelpCircle className="mx-auto h-12 w-12 text-blue-400" />
                <h3 className="mt-2 text-2xl font-bold text-white">How to Use DataDash</h3>
                <div className="mt-4 text-left text-gray-300 space-y-4">
                    <p>1. <strong className="text-white">Sign Up:</strong> Create a new account from the main page.</p>
                    <p>2. <strong className="text-white">Login:</strong> Use your credentials to access your dashboard.</p>
                    <p>3. <strong className="text-white">Upload:</strong> On the dashboard, drag & drop or click to upload a CSV or Excel file.</p>
                    <p>4. <strong className="text-white">Analyze:</strong> The backend will automatically process your file and generate a data summary and interactive charts.</p>
                    <p>5. <strong className="text-white">History:</strong> Visit the History page to see a list of all your past uploads.</p>
                </div>
            </div>
        </GlassCard>
    </div>
);

export default App;
