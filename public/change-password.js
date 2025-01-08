document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#change-password-form');
    const emailInput = document.querySelector('#email');
    const currentPasswordInput = document.querySelector('#currentPassword');
    const newPasswordInput = document.querySelector('#newPassword');
    const confirmNewPasswordInput = document.querySelector('#confirmNewPassword');
    const errorMessage = document.querySelector('#error-message');

    const API_BASE_URL = 'http://127.0.0.1:3000/api';

    // Verify all required elements exist
    if (!form || !emailInput || !currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput || !errorMessage) {
        console.error('Required form elements not found');
        alert('Form initialization error. Please refresh the page.');
        return;
    }

    // Client-side password validation
    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return {
            valid: passwordRegex.test(password),
            message: 'Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character'
        };
    };

    // Client-side email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(email),
            message: 'Please enter a valid email address'
        };
    };

    // Display error message
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.add('error');
        setTimeout(() => {
            errorMessage.textContent = '';
            errorMessage.classList.remove('error');
        }, 5000);
    };

    // Handle session timeout/errors
    const handleSessionError = () => {
        window.location.href = '/index.html?message=' + encodeURIComponent('Session expired. Please log in again.');
    };

    // Button state management
    const setSubmitButtonState = (button, isDisabled) => {
        button.disabled = isDisabled;
        button.classList.toggle('disabled', isDisabled);
    };

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Reset previous error states
        errorMessage.textContent = '';
        [emailInput, currentPasswordInput, newPasswordInput, confirmNewPasswordInput].forEach(input => {
            input.classList.remove('error');
        });

        // Validate inputs
        const emailValidation = validateEmail(emailInput.value);
        const currentPasswordValidation = validatePassword(currentPasswordInput.value);
        const newPasswordValidation = validatePassword(newPasswordInput.value);
        const passwordsMatch = newPasswordInput.value === confirmNewPasswordInput.value;

        // Validation checks
        if (!emailValidation.valid) {
            emailInput.classList.add('error');
            showError(emailValidation.message);
            return;
        }

        if (!currentPasswordValidation.valid) {
            currentPasswordInput.classList.add('error');
            showError(currentPasswordValidation.message);
            return;
        }

        if (!newPasswordValidation.valid) {
            newPasswordInput.classList.add('error');
            showError(newPasswordValidation.message);
            return;
        }

        if (!passwordsMatch) {
            confirmNewPasswordInput.classList.add('error');
            showError('New passwords do not match');
            return;
        }

        setSubmitButtonState(submitButton, true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email: emailInput.value, 
                    currentPassword: currentPasswordInput.value, 
                    newPassword: newPasswordInput.value 
                })
            });

            const data = await response.json();

            console.log('Server response:', {
                status: response.status,
                success: data.success,
                message: data.message
            });

            if (response.ok) {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Password updated successfully. Redirecting...';
                form.parentNode.insertBefore(successMessage, form);
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else {
                if (response.status === 401) {
                    handleSessionError();
                    return;
                }

                showError(data.message || 'Failed to update password');
                
                // Handle specific error 
                switch(data.code) {
                    case 'EMAIL_ERROR':
                        emailInput.classList.add('error');
                        emailInput.focus();
                        break;
                    case 'CURRENT_PASSWORD_ERROR':
                        currentPasswordInput.classList.add('error');
                        currentPasswordInput.focus();
                        break;
                    case 'NEW_PASSWORD_ERROR':
                        newPasswordInput.classList.add('error');
                        newPasswordInput.focus();
                        break;
                }
            }
        } catch (error) {
            console.error('Password change error:', error);
            showError('Network error. Please try again.');
        } finally {
            setSubmitButtonState(submitButton, false);
        }
    });

    // Real-time password strength feedback
    newPasswordInput.addEventListener('input', (e) => {
        const strengthIndicator = document.createElement('div');
        strengthIndicator.id = 'password-strength';
        
        const passwordValidation = validatePassword(e.target.value);
        strengthIndicator.textContent = passwordValidation.valid 
            ? 'Strong password ✓' 
            : 'Weak password. ' + passwordValidation.message;
        
        strengthIndicator.style.color = passwordValidation.valid ? 'green' : 'red';
        
        const existingIndicator = document.getElementById('password-strength');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        newPasswordInput.parentNode.appendChild(strengthIndicator);
    });
});