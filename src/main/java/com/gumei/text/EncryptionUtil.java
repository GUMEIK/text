package com.gumei.text;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class EncryptionUtil {
    private static final int SALT_LENGTH = 16;
    private static final int IV_LENGTH = 12;
    private static final int ITERATIONS = 100000;
    private static final int KEY_LENGTH = 256;
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String encrypt(String text, String password) throws Exception {
        // 生成随机盐值
        byte[] salt = new byte[SALT_LENGTH];
        SECURE_RANDOM.nextBytes(salt);

        // 生成密钥
        SecretKey key = generateKey(password, salt);

        // 生成随机 IV
        byte[] iv = new byte[IV_LENGTH];
        SECURE_RANDOM.nextBytes(iv);

        // 初始化加密器
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

        // 加密数据
        byte[] encryptedData = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));

        // 组合数据：salt + iv + 加密数据
        byte[] combined = new byte[salt.length + iv.length + encryptedData.length];
        System.arraycopy(salt, 0, combined, 0, salt.length);
        System.arraycopy(iv, 0, combined, salt.length, iv.length);
        System.arraycopy(encryptedData, 0, combined, salt.length + iv.length, encryptedData.length);

        // 转换为 Base64
        return Base64.getEncoder().encodeToString(combined);
    }

    public static String decrypt(String encryptedText, String password) throws Exception {
        // 解码 Base64
        byte[] combined = Base64.getDecoder().decode(encryptedText);

        // 提取 salt、iv 和加密数据
        byte[] salt = new byte[SALT_LENGTH];
        byte[] iv = new byte[IV_LENGTH];
        byte[] encryptedData = new byte[combined.length - SALT_LENGTH - IV_LENGTH];

        System.arraycopy(combined, 0, salt, 0, SALT_LENGTH);
        System.arraycopy(combined, SALT_LENGTH, iv, 0, IV_LENGTH);
        System.arraycopy(combined, SALT_LENGTH + IV_LENGTH, encryptedData, 0, encryptedData.length);

        // 生成密钥
        SecretKey key = generateKey(password, salt);

        // 初始化解密器
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

        // 解密数据
        byte[] decryptedData = cipher.doFinal(encryptedData);
        return new String(decryptedData, StandardCharsets.UTF_8);
    }

    private static SecretKey generateKey(String password, byte[] salt) throws Exception {
        // 使用 PBKDF2 生成密钥
        PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(),
                salt,
                ITERATIONS,
                KEY_LENGTH
        );

        SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }


    /**
     * 加密 Markdown 文件内容并保存到新文件
     *
     * @param inputPath 输入文件路径
     * @param outputPath 输出文件路径
     * @param password 加密密码
     * @throws Exception 如果发生IO错误或加密错误
     */
    public static void encryptFile(String inputPath, String outputPath, String password) throws Exception {
        // 读取输入文件
        String content = readFile(inputPath);
        
        // 加密内容
        String encryptedContent = encrypt(content, password);
        
        // 写入加密内容到输出文件
        writeFile(outputPath, encryptedContent);
    }

    /**
     * 解密 Markdown 文件内容并保存到新文件
     *
     * @param inputPath 输入文件路径
     * @param outputPath 输出文件路径
     * @param password 解密密码
     * @throws Exception 如果发生IO错误或解密错误
     */
    public static void decryptFile(String inputPath, String outputPath, String password) throws Exception {
        // 读取加密文件
        String encryptedContent = readFile(inputPath);
        
        // 解密内容
        String decryptedContent = decrypt(encryptedContent, password);
        
        // 写入解密内容到输出文件
        writeFile(outputPath, decryptedContent);
    }

    /**
     * 读取文件内容
     */
    private static String readFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        byte[] bytes = Files.readAllBytes(path);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    /**
     * 写入内容到文件
     */
    private static void writeFile(String filePath, String content) throws IOException {
        Path path = Paths.get(filePath);
        Files.write(path, content.getBytes(StandardCharsets.UTF_8));
    }

    public static void main(String[] args) throws Exception {
        // 示例用法
        String inputFile = "test.md";
        String encryptedFile = "encrypted.md";
        String decryptedFile = "decrypted.md";
        String password = "your-secure-password";

        // 加密文件
        encryptFile(inputFile, encryptedFile, password);
        System.out.println("文件加密完成，已保存到: " + encryptedFile);

        // 解密文件
        decryptFile(encryptedFile, decryptedFile, password);
        System.out.println("文件解密完成，已保存到: " + decryptedFile);
    }
}