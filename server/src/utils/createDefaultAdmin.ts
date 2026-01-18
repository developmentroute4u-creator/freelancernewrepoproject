import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.js';

export const createDefaultAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', adminEmail);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
            email: adminEmail,
            password: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
        });

        console.log('✅ Default admin user created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('⚠️  Please change the password after first login!');
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
    }
};
