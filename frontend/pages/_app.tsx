import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';
    const isHomePage = router.pathname === '/';
    // Dashboard pages have their own NavBar in DashboardLayout
    const isDashboardPage = router.pathname.startsWith('/dashboard/');

    return (
        <AuthProvider>
            {!isLoginPage && !isHomePage && !isDashboardPage && <NavBar />}
            <Component {...pageProps} />
        </AuthProvider>
    );
}
