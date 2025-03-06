void setup() {
  Serial.begin(9600);
}

void loop() {
  delay(10000);
  volatile byte foo = 1 / 0;
}
