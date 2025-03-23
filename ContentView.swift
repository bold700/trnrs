import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Welkom bij TRNRS")
                    .font(.largeTitle)
                    .padding()
                
                Spacer()
                
                Button(action: {
                    // Actie hier
                }) {
                    Text("Start")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()
            }
            .navigationTitle("TRNRS")
        }
    }
}

#Preview {
    ContentView()
} 