const fs = require('fs');
const file = 'src/components/custom/POSClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const modals = `      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onSuccess={(cus?: any) => {
          if (cus) setSelectedCustomer(cus);
        }} 
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        finalTotal={finalTotal}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );`;

content = content.replace('    </div>\n  );', modals);
fs.writeFileSync(file, content);
console.log('Successfully added modals to POSClient.tsx');
