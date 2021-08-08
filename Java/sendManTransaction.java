import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import org.aimanj.crypto.*;
import org.aimanj.protocol.AiManj;
import org.aimanj.protocol.core.DefaultBlockParameterName;
import org.aimanj.protocol.core.methods.response.*;
import org.aimanj.protocol.http.HttpService;
import org.aimanj.utils.Convert;
import org.aimanj.utils.Numeric;

import java.io.IOException;
import java.math.BigInteger;
import java.security.SignatureException;
import java.util.*;
import java.util.concurrent.ExecutionException;

public class sendManTransaction {
    static AiManj man3j = AiManj.build(new HttpService("https://api01.matrix.io"));

    public static void main(String[] args) {
        String addressWeSendFrom = "addressWeSendFrom";
        String addressWeReceive = "addressWeReceive";
        String privateKey = "somePrivateKey";
        BigInteger value = Convert.toWei("0.1", Convert.Unit.MAN).toBigInteger(); //Amount we want to send
        BigInteger gasLimit = new BigInteger("6000000");
        byte chainId = 1;
        long unixTime = System.currentTimeMillis() / 1000L;

        ManGetTransactionCount count = null;
        try {
            count = man3j.manGetTransactionCount(addressWeSendFrom, DefaultBlockParameterName.LATEST).sendAsync().get();
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
        }
        BigInteger nonce = count != null ? count.getTransactionCount() : null;

        Credentials credentials = Credentials.create(privateKey);

        ManGasPrice manGasPrice = null;
        try {
            manGasPrice = man3j.manGasPrice().send();
        } catch (IOException e) {
            e.printStackTrace();
        }
        BigInteger gasPrice = Objects.requireNonNull(manGasPrice).getGasPrice();

        ManGetBalance balanceWei = null;
        try {
            balanceWei = man3j.manGetBalance(addressWeSendFrom, DefaultBlockParameterName.LATEST).send();
        } catch (IOException e) {
            e.printStackTrace();
        }
        List<Map<String, BigInteger>> balanceList = Objects.requireNonNull(balanceWei).getBalance();

        System.out.println("Man balance (all) for address: " + balanceList);
        System.out.println(Convert.fromWei(balanceList.get(0).get("balance").toString(), Convert.Unit.MAN).toString().concat(" MAN"));

        //We are building the list for extra_to field
        List list = new ArrayList();
        List listResult = new ArrayList();
        List list1 = new ArrayList();
        list1.add(BigInteger.ZERO);
        list1.add(BigInteger.ZERO);
        List tempList = new ArrayList();
        list1.add(tempList);
        listResult.add(list1);
        list.add(listResult);

        RawTransaction rawTransaction = RawTransaction.createManTransaction(nonce, gasPrice,
                gasLimit, addressWeReceive, "0x", "MAN", value, BigInteger.ZERO, BigInteger.ZERO, BigInteger.valueOf(unixTime), list);
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);
        SignedRawTransaction rawTransaction1 = (SignedRawTransaction) TransactionDecoder.decode(hexValue);
        try {
            System.out.println("Sending coins from: " + rawTransaction1.getFrom());
        } catch (SignatureException e) {
            e.printStackTrace();
        }
        HashMap rawTransactionDetailsMap = new HashMap();
        rawTransactionDetailsMap.put("nonce", Numeric.toHexStringWithPrefix(rawTransaction1.getNonce()));
        rawTransactionDetailsMap.put("v", "0x" + byteToHex(rawTransaction1.getSignatureData().getV()));
        rawTransactionDetailsMap.put("r", Numeric.toHexString(rawTransaction1.getSignatureData().getR()));
        rawTransactionDetailsMap.put("s", Numeric.toHexString(rawTransaction1.getSignatureData().getS()));
        rawTransactionDetailsMap.put("to", rawTransaction1.getTo());
        rawTransactionDetailsMap.put("currency", rawTransaction1.getTo().split("\\.")[0]);
        rawTransactionDetailsMap.put("gasPrice", Numeric.toHexStringWithPrefix(rawTransaction1.getGasPrice()));
        rawTransactionDetailsMap.put("gas", Numeric.toHexStringWithPrefix(rawTransaction1.getGasLimit()));
        rawTransactionDetailsMap.put("commitTime", rawTransaction1.getCommitTime());
        rawTransactionDetailsMap.put("isEntrustTx", rawTransaction1.getIsEntrustTx());
        rawTransactionDetailsMap.put("txEnterType", rawTransaction1.getTxEnterType());
        List extraToList = (List) ((List) ((List) rawTransaction1.getExtra_to().get(0)).get(0)).get(2);
        List extraTo = new ArrayList();
        for (int i = 0, length = extraToList.size(); i < length; i++) {
            HashMap<String, String> toMap = new HashMap<String, String>();
            toMap.put("to", (String) ((List) extraToList.get(0)).get(0));
            toMap.put("value", Numeric.toHexStringWithPrefix((BigInteger) ((List) extraToList.get(0)).get(1)));
            extraTo.add(toMap);
        }
        rawTransactionDetailsMap.put("extra_to", extraTo);
        rawTransactionDetailsMap.put("data", "0x" + rawTransaction1.getData());
        rawTransactionDetailsMap.put("txType", ((List) ((List) rawTransaction1.getExtra_to().get(0)).get(0)).get(0));
        rawTransactionDetailsMap.put("lockHeight", ((List) ((List) rawTransaction1.getExtra_to().get(0)).get(0)).get(1));
        rawTransactionDetailsMap.put("value", Numeric.toHexStringWithPrefix(rawTransaction1.getValue()));
        ManSendTransaction transactionResponse = null;
        try {
            transactionResponse = man3j.manSendRawTransaction(rawTransactionDetailsMap).sendAsync().get();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
        try {
            System.out.println(convertObjToString(transactionResponse));

            Optional<Transaction> tx = Optional.empty();
            if (transactionResponse != null) {
                tx = man3j.manGetTransactionByHash(transactionResponse.getTransactionHash()).send().getTransaction();
            }
            if (tx.isPresent()) {
                System.out.println(convertObjToString(tx));
            }

        } catch (IOException e) {
            e.printStackTrace();
        }


    }

    public static String convertObjToString(Object obj) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        return gson.toJson(obj, new TypeToken<Object>() {
        }.getType());
    }

    public static String byteToHex(byte b) {
        String hex = Integer.toHexString(b & 0xFF);
        if (hex.length() < 2) {
            hex = "0" + hex;
        }
        return hex;
    }
}
