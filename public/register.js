document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDisplay = document.getElementById('register-error');

    const validateForm = () => {
        if (!emailInput.value || !emailInput.value.includes('@')) {
            return 'Please enter a valid email address';
        }
        if (passwordInput.value.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        return null;
    };

    const showError = (message) => {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    };

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Still prevent default initially
        
        const error = validateForm();
        if (error) {
            showError(error);
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Submit the form to trigger the action URL
                registerForm.submit();
            } else {
                showError(data.message || 'Registration failed');
            }
        } catch (error) {
            showError('Network error. Please try again.');
        }
    });
});
