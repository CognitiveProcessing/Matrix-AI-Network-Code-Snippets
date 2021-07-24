import org.aimanj.protocol.AiManj;
import org.aimanj.protocol.core.DefaultBlockParameter;
import org.aimanj.protocol.core.DefaultBlockParameterName;
import org.aimanj.protocol.core.methods.response.ManBlock;
import org.aimanj.protocol.core.methods.response.ManGetBalance;
import org.aimanj.protocol.http.HttpService;
import org.aimanj.utils.Convert;

import java.io.IOException;
import java.math.BigInteger;
import java.util.*;

public class GetTopHolders {
    static AiManj man3j = AiManj.build(new HttpService("https://api01.matrix.io"));

    public static void main(String[] args) throws IOException {
        Map<String, BigInteger> addressesWithBalance = new HashMap();
        try {
            BigInteger blockNumber = man3j.manGetBlockByNumber(DefaultBlockParameterName.LATEST, true).send().getBlock().getNumber();
            int lastNumberOfBlocksToSearchFor = 10;
            for (int i = blockNumber.intValue() - lastNumberOfBlocksToSearchFor; i < blockNumber.intValue(); i++) {
                try {
                    ManBlock manBlock = man3j.manGetBlockByNumber(DefaultBlockParameter.valueOf(BigInteger.valueOf(i)), true).send();
                    ManBlock.Block block = manBlock.getBlock();

                    System.out.print(i + " ");
                    for (ManBlock.TransactionResult transactionResult : block.getTransactions()) {
                        if (((ManBlock.TransactionObject) transactionResult.get()).getValue().compareTo(BigInteger.ZERO) > 0) {
                            addressesWithBalance.put(((ManBlock.TransactionObject) transactionResult.get()).getTo(), BigInteger.ZERO);
                        }
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            for (Map.Entry<String, BigInteger> entry : addressesWithBalance.entrySet()) {
                ManGetBalance balanceWei = null;
                try {
                    balanceWei = man3j.manGetBalance(entry.getKey(), DefaultBlockParameterName.LATEST).send();
                    List<Map<String, BigInteger>> balanceList = balanceWei.getBalance();
                    entry.setValue(balanceList.get(0).get("balance"));
                } catch (Error error) {
                    System.out.println(error);
                }
            }
            Object[] array = addressesWithBalance.entrySet().toArray();
            Arrays.sort(array, (Comparator) (o1, o2) -> ((Map.Entry<String, BigInteger>) o2).getValue()
                    .compareTo(((Map.Entry<String, BigInteger>) o1).getValue()));
            for (Object entry : array) {
                System.out.printf("%s: %s%n", ((Map.Entry<String, BigInteger>) entry).getKey(),
                        Convert.fromWei((((Map.Entry<String, BigInteger>) entry).getValue().toString()), Convert.Unit.MAN));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
