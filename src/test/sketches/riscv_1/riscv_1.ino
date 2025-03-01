void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("SETUP");
}

class a {
public:
  int a = 323;
  int geta() {
    return a;
  }
};

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println("LOOP");
  delay(2000);
  a* _a = 0;
  //a* _a = new a();
  Serial.println(_a->geta());
}
