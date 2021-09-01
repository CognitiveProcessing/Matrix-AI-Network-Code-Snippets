	networks: {  
	    development: {  
	       type: "matrix",  
	        skipDryRun: true,  
	        provider: () => new MANHDWalletProvider(1,"0xyourwalletprivatekeygoesthere","nodeurlgoesthere"),  
	        network_id: "1",  
	        gasPrice: 18000000000  
	  }  
  }
