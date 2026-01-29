'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    className?: string;
}

export default function LogoutButton({ variant = 'outline', size = 'md', className }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = () => {
        // Clear token from localStorage
        localStorage.removeItem('token');

        // Redirect to home or login page
        router.push('/');
    };

    return (
        <Button
            onClick={handleLogout}
            variant={variant}
            size={size}
            className={className}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    );
}
