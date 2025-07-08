package com.gumei.text;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class EncryptionUtilTest {


    @Test
    public void test() throws Exception {
        String originFilePath = "/Users/xxx/codding/private/text/html/test1.md";
        String outputFilePath = "/Users/xxx/codding/private/text/html/test1output.md";
        String key = "12";
        EncryptionUtil.decryptFile(outputFilePath,originFilePath,key);
    }

}
