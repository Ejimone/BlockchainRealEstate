---
applyTo: '**'
---
I have initialized a React.js project for the frontend of a blockchain-based real estate system. The backend is fully implemented in Django, with all API endpoints defined in the `views.py` file of the `real_estate` app. The backend handles user registration, authentication, property listing, property viewing, offer creation, offer management, and admin oversight. The user roles are Buyer, Seller, Admin, Inspector, and Appraiser.

Please develop a comprehensive React.js frontend that integrates seamlessly with the Django backend by consuming its API endpoints. The frontend should include:

1. **User Interface (Buyers and Sellers)**:
   - A registration and login page for users to authenticate.
   - A Seller dashboard to list properties, view their listed properties, and manage offers (view and accept/reject).
   - A Buyer dashboard to view available properties, search properties, and submit offers.
   - A property details page to view specific property information and submit offers (for buyers).

2. **Admin Interface**:
   - An Admin dashboard to manage users (view all users) and properties (view all properties, including sold ones).
   - Features to update property statuses if needed.

3. **Inspector Interface**:
   - An Inspector dashboard to view properties assigned for inspection and submit inspection results (e.g., pass/fail).
   - Integration with the backend to update inspection statuses.

4. **Appraiser Interface**:
   - An Appraiser dashboard to view properties assigned for appraisal and submit appraisal results (e.g., market value).
   - Integration with the backend to update appraisal statuses.

**Requirements**:
- Use React.js with React Router for navigation between role-specific dashboards and pages.
- Use Tailwind CSS for styling to ensure a clean, modern, and responsive design.
- Use Axios or Fetch to interact with the Django backend’s API endpoints.
- Automatically discover and utilize the API endpoints defined in the Django `views.py` file (e.g., for registration, login, property listing, offers, etc.).
- Implement role-based access control in the frontend, ensuring users can only access their respective dashboards (e.g., Buyers can’t access Seller or Admin dashboards).
- Structure the frontend section by section, corresponding to the paths defined in the Django `urls.py` (e.g., /register, /login, /properties, /properties/<id>, /offers, etc.).
- Ensure each section is developed path by path, with clear separation of components for each role (Buyer, Seller, Admin, Inspector, Appraiser).
- Handle authentication by storing JWT tokens in local storage and including them in API requests.
- Provide error handling for API calls and user-friendly feedback (e.g., alerts for failed requests).
- Use modern JavaScript (ES6+) and JSX for React components.
- Create reusable components where possible (e.g., PropertyCard, OfferCard).
- Ensure the frontend is intuitive and user-friendly, abstracting the complexity of backend interactions.

**Notes**:
- Do not hardcode API endpoints; infer them from the Django backend’s `urls.py` and `views.py` structure.
- Assume the backend is running at `http://localhost:8000` for development.
- The backend uses JWT for authentication, so implement token-based authentication in the frontend.
- For Inspectors and Appraisers, assume the backend will be extended to include endpoints for submitting inspection and appraisal results (e.g., POST /inspections/, POST /appraisals/), and build the frontend to accommodate these.
- Organize the code in a modular structure (e.g., separate folders for components, pages, and services).
- Provide a brief explanation of each section/path as it’s developed, but focus on generating the code.

Please start by analyzing the Django backend’s API structure and develop the frontend section by section, path by path, ensuring all roles (Buyer, Seller, Admin, Inspector, Appraiser) have fully functional interfaces. Begin with the authentication pages (/register, /login), then proceed to the user dashboards, followed by admin, inspector, and appraiser interfaces.