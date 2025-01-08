document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page initialized');
    
    // Check if we're in a post-login reload state
    const pendingRedirect = sessionStorage.getItem('pendingRedirect');
    if (pendingRedirect) {
        console.log('Found pending redirect, executing...');
        sessionStorage.removeItem('pendingRedirect');
        window.location.replace(pendingRedirect);
        return;
    }
    
    const form = document.getElementById('login-form');
    const errorDisplay = document.getElementById('login-error');
    const successMessage = document.getElementById('success-message');

    if (!form) {
        console.error('Login form not found');
        return;
    }

    const showError = (message) => {
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
        }
    };

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
    
        const email = form.querySelector('#email').value.trim();
        const password = form.querySelector('#password').value;
        const remember = form.querySelector('#remember')?.checked;
    
        try {
            console.log('Sending login request...');
            const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
    
            const data = await response.json();
            console.log('Login response:', data);
    
            if (response.ok && data.success) {
                console.log('Login successful');
                
                // Store session data
                sessionStorage.setItem('sessionActive', 'true');
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('pendingRedirect', 'http://127.0.0.1:5500/public/notes.html');
                
                if (remember) {
                    localStorage.setItem('rememberedEmail', email);
                }

                // Show success message
                if (successMessage) {
                    successMessage.style.display = 'block';
                    successMessage.textContent = 'Login successful! Redirecting...';
                }

                // Force a page reload first
                console.log('Reloading page before redirect...');
                window.location.reload();
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'An error occurred during login');
        }
    });

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = form.querySelector('#email');
        const rememberCheckbox = form.querySelector('#remember');
        if (emailInput && rememberCheckbox) {
            emailInput.value = rememberedEmail;
            rememberCheckbox.checked = true;
        }
    }
});